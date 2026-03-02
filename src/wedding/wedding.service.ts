import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wedding } from './schemas/wedding.schema';
import { CreateWeddingDto } from './dto/create-wedding.dto';
import { UpdateWeddingDto } from './dto/update-wedding.dto';
import { generateSlug } from './helpers/slug.helper';

@Injectable()
export class WeddingService {
  constructor(
    @InjectModel(Wedding.name) private weddingModel: Model<Wedding>,
  ) {}

  async create(userId: string, dto: CreateWeddingDto): Promise<Wedding> {
    const existing = await this.weddingModel.findOne({ userId });
    if (existing) {
      throw new ConflictException('Ya tienes una boda creada');
    }

    let slug = generateSlug(dto.partner1Name, dto.partner2Name);
    slug = await this.ensureUniqueSlug(slug);

    return this.weddingModel.create({
      userId,
      slug,
      ...dto,
      date: new Date(dto.date),
    });
  }

  async findByUserId(userId: string): Promise<Wedding> {
    const wedding = await this.weddingModel.findOne({ userId });
    if (!wedding) throw new NotFoundException('No tienes boda creada');
    return wedding;
  }

  async findBySlug(slug: string): Promise<Wedding> {
    const wedding = await this.weddingModel.findOne({
      slug: slug.toLowerCase(),
    });
    if (!wedding) throw new NotFoundException('Boda no encontrada');
    return wedding;
  }

  async update(
    weddingId: string,
    userId: string,
    dto: UpdateWeddingDto,
  ): Promise<Wedding> {
    const wedding = await this.weddingModel.findById(weddingId);
    if (!wedding) throw new NotFoundException('Boda no encontrada');
    if (wedding.userId.toString() !== userId) {
      throw new ForbiddenException();
    }

    if (dto.slug && dto.slug !== wedding.slug) {
      const slugTaken = await this.weddingModel.findOne({
        slug: dto.slug.toLowerCase(),
        _id: { $ne: weddingId },
      });
      if (slugTaken) throw new ConflictException('Ese slug ya está en uso');
    }

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.date) updateData.date = new Date(dto.date);

    const updated = await this.weddingModel.findByIdAndUpdate(
      weddingId,
      updateData,
      { new: true },
    );
    return updated!;
  }

  toResponse(wedding: Wedding) {
    return {
      id: wedding._id.toString(),
      partner1Name: wedding.partner1Name,
      partner2Name: wedding.partner2Name,
      date: wedding.date.toISOString().split('T')[0],
      venue: wedding.venue,
      location: wedding.location || '',
      estimatedGuests: wedding.estimatedGuests,
      estimatedBudget: wedding.estimatedBudget,
      photoUrl: wedding.photoUrl,
      slug: wedding.slug,
    };
  }

  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 2;
    while (await this.weddingModel.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wedding } from './schemas/wedding.schema';
import { CreateWeddingDto } from './dto/create-wedding.dto';
import { UpdateWeddingDto } from './dto/update-wedding.dto';
import { generateSlug } from './helpers/slug.helper';
import { UserService } from '../user/user.service';

@Injectable()
export class WeddingService {
  constructor(
    @InjectModel(Wedding.name) private weddingModel: Model<Wedding>,
    private userService: UserService,
  ) {}

  async create(userId: string, dto: CreateWeddingDto): Promise<Wedding> {
    const userObjectId = new Types.ObjectId(userId);
    const existing = await this.weddingModel.findOne({ userId: userObjectId });
    if (existing) {
      throw new ConflictException('Ya tienes una boda creada');
    }

    let slug = generateSlug(dto.partner1Name, dto.partner2Name);
    slug = await this.ensureUniqueSlug(slug);

    const wedding = await this.weddingModel.create({
      userId: userObjectId,
      slug,
      ...dto,
      date: new Date(dto.date),
    });

    await this.userService.setOnboardingComplete(userId);
    return wedding;
  }

  async findByUserId(userId: string): Promise<Wedding> {
    const wedding = await this.weddingModel.findOne({ userId: new Types.ObjectId(userId) });
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

    const { date, mealColors, allergyColors, ...rest } = dto;
    
    const restRecord = rest as Record<string, unknown>;
    delete restRecord.userId;
    delete restRecord._id;
    delete restRecord.id;

    Object.keys(restRecord).forEach(key => {
      if (restRecord[key] !== undefined) {
        wedding.set(key, restRecord[key]);
      }
    });

    if (date) wedding.date = new Date(date);
    
    // Manejo explícito de Mapas para evitar errores de tipo en el save()
    if (mealColors) {
      wedding.mealColors = new Map(Object.entries(mealColors));
    }
    if (allergyColors) {
      wedding.allergyColors = new Map(Object.entries(allergyColors));
    }

    return wedding.save();
  }

  toResponse(wedding: Wedding) {
    return {
      id: wedding._id.toString(),
      partner1Name: wedding.partner1Name,
      partner1Last: wedding.partner1Last || '',
      partner1Role: wedding.partner1Role || 'Novio',
      partner2Name: wedding.partner2Name,
      partner2Last: wedding.partner2Last || '',
      partner2Role: wedding.partner2Role || 'Novia',
      date: wedding.date.toISOString().split('T')[0],
      venue: wedding.venue,
      location: wedding.location || '',
      estimatedGuests: wedding.estimatedGuests,
      estimatedBudget: wedding.estimatedBudget,
      currency: wedding.currency || 'EUR',
      timezone: wedding.timezone || 'Europe/Madrid',
      photoUrl: wedding.photoUrl,
      slug: wedding.slug,
      mealOptions: wedding.mealOptions || [],
      allergyOptions: wedding.allergyOptions || [],
      allergyColors: Object.fromEntries(wedding.allergyColors ?? new Map()),
      mealColors: Object.fromEntries(wedding.mealColors ?? new Map()),
      transportOptions: wedding.transportOptions || [],
    };
  }

  async checkSlug(slug: string, userId: string): Promise<{ available: boolean }> {
    const cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const userWedding = await this.weddingModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    const conflict = await this.weddingModel.findOne({
      slug: cleaned,
      ...(userWedding?._id ? { _id: { $ne: userWedding._id } } : {}),
    });
    return { available: !conflict };
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

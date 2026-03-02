import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WebPage } from './schemas/web-page.schema';
import { CreateWebPageDto, UpdateWebPageDto, PublicRsvpDto } from './dto/create-web-page.dto';
import { Guest, RsvpStatus } from '../guest/schemas/guest.schema';

@Injectable()
export class WebPageService {
  constructor(
    @InjectModel(WebPage.name) private webPageModel: Model<WebPage>,
    @InjectModel(Guest.name) private guestModel: Model<Guest>,
    @InjectModel('Wedding') private weddingModel: Model<any>,
  ) {}

  async findByWeddingId(weddingId: string): Promise<WebPage | null> {
    return this.webPageModel.findOne({ weddingId: new Types.ObjectId(weddingId) });
  }

  async create(weddingId: string, dto: CreateWebPageDto): Promise<WebPage> {
    const existing = await this.webPageModel.findOne({ weddingId: new Types.ObjectId(weddingId) });
    if (existing) {
      // Update instead of duplicating
      return this.update(weddingId, dto);
    }

    // Copy meal/transport options from wedding
    const wedding = await this.weddingModel.findById(weddingId);

    return this.webPageModel.create({
      weddingId: new Types.ObjectId(weddingId),
      ...dto,
      mealOptions: wedding?.mealOptions || ['Carne', 'Pescado', 'Vegetariano', 'Infantil'],
      transportOptions: wedding?.transportOptions || [],
      heroTitle: wedding ? `${wedding.partner1Name} & ${wedding.partner2Name}` : '',
    });
  }

  async update(weddingId: string, dto: UpdateWebPageDto): Promise<WebPage> {
    const page = await this.webPageModel.findOneAndUpdate(
      { weddingId: new Types.ObjectId(weddingId) },
      { $set: dto },
      { new: true },
    );
    if (!page) throw new NotFoundException('Web page not found');
    return page;
  }

  async publish(weddingId: string): Promise<WebPage> {
    const page = await this.webPageModel.findOneAndUpdate(
      { weddingId: new Types.ObjectId(weddingId) },
      { $set: { isPublished: true, publishedAt: new Date() } },
      { new: true },
    );
    if (!page) throw new NotFoundException('Web page not found');

    // Also set wedding as published
    await this.weddingModel.findByIdAndUpdate(weddingId, { isPublished: true });
    return page;
  }

  async unpublish(weddingId: string): Promise<WebPage> {
    const page = await this.webPageModel.findOneAndUpdate(
      { weddingId: new Types.ObjectId(weddingId) },
      { $set: { isPublished: false } },
      { new: true },
    );
    if (!page) throw new NotFoundException('Web page not found');

    await this.weddingModel.findByIdAndUpdate(weddingId, { isPublished: false });
    return page;
  }

  // Public methods (no auth needed)

  async getPublicPage(slug: string) {
    const wedding = await this.weddingModel.findOne({ slug });
    if (!wedding) throw new NotFoundException('Wedding not found');

    const webPage = await this.webPageModel.findOne({ weddingId: wedding._id });
    if (!webPage || !webPage.isPublished) throw new NotFoundException('Page not published');

    return {
      wedding: {
        partner1Name: wedding.partner1Name,
        partner2Name: wedding.partner2Name,
        date: wedding.date,
        venue: wedding.venue,
        location: wedding.location,
        slug: wedding.slug,
      },
      page: {
        templateId: webPage.templateId,
        colorPalette: webPage.colorPalette,
        fontTitle: webPage.fontTitle,
        fontBody: webPage.fontBody,
        rsvpEnabled: webPage.rsvpEnabled,
        rsvpDeadline: webPage.rsvpDeadline,
        mealOptions: webPage.mealOptions,
        transportOptions: webPage.transportOptions,
        heroTitle: webPage.heroTitle,
        heroSubtitle: webPage.heroSubtitle,
        storyText: webPage.storyText,
        scheduleText: webPage.scheduleText,
        locationText: webPage.locationText,
        transportText: webPage.transportText,
        accommodationText: webPage.accommodationText,
        dressCode: webPage.dressCode,
        customSections: webPage.customSections,
      },
    };
  }

  async submitRsvp(slug: string, dto: PublicRsvpDto) {
    const wedding = await this.weddingModel.findOne({ slug });
    if (!wedding) throw new NotFoundException('Wedding not found');

    const webPage = await this.webPageModel.findOne({ weddingId: wedding._id });
    if (!webPage?.isPublished || !webPage?.rsvpEnabled) {
      throw new BadRequestException('RSVP is not available');
    }

    if (webPage.rsvpDeadline && new Date() > new Date(webPage.rsvpDeadline)) {
      throw new BadRequestException('RSVP deadline has passed');
    }

    // Find guest by name (case-insensitive partial match)
    const nameParts = dto.guestName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const query: any = { weddingId: wedding._id };
    if (lastName) {
      query.firstName = new RegExp(`^${firstName}$`, 'i');
      query.lastName = new RegExp(`^${lastName}$`, 'i');
    } else {
      query.$or = [
        { firstName: new RegExp(`^${firstName}$`, 'i') },
        { lastName: new RegExp(`^${firstName}$`, 'i') },
      ];
    }

    const guest = await this.guestModel.findOne(query);
    if (!guest) throw new NotFoundException('Guest not found in the list');

    // Update guest RSVP
    guest.rsvpStatus = dto.rsvpStatus === 'confirmed' ? RsvpStatus.CONFIRMED : RsvpStatus.REJECTED;
    if (dto.mealChoice) guest.mealChoice = dto.mealChoice;
    if (dto.allergies !== undefined) guest.allergies = dto.allergies;
    if (dto.transport !== undefined) guest.transport = dto.transport;
    if (dto.transportPickupPoint) guest.transportPickupPoint = dto.transportPickupPoint;
    await guest.save();

    return { success: true, message: 'RSVP updated successfully' };
  }

  toResponse(page: WebPage) {
    return {
      id: page._id.toString(),
      templateId: page.templateId,
      colorPalette: page.colorPalette,
      fontTitle: page.fontTitle,
      fontBody: page.fontBody,
      rsvpEnabled: page.rsvpEnabled,
      rsvpDeadline: page.rsvpDeadline?.toISOString?.()?.split('T')[0] || null,
      mealOptions: page.mealOptions,
      transportOptions: page.transportOptions,
      heroTitle: page.heroTitle,
      heroSubtitle: page.heroSubtitle,
      storyText: page.storyText,
      scheduleText: page.scheduleText,
      locationText: page.locationText,
      transportText: page.transportText,
      accommodationText: page.accommodationText,
      dressCode: page.dressCode,
      customSections: page.customSections,
      isPublished: page.isPublished,
      publishedAt: page.publishedAt?.toISOString?.() || null,
    };
  }
}

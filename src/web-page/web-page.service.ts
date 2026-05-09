import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WebPage } from './schemas/web-page.schema';
import { CreateWebPageDto, UpdateWebPageDto, PublicRsvpDto, RsvpLookupDto, GroupRsvpDto } from './dto/create-web-page.dto';
import { Guest, RsvpStatus } from '../guest/schemas/guest.schema';
import { Wedding } from '../wedding/schemas/wedding.schema';

@Injectable()
export class WebPageService {
  constructor(
    @InjectModel(WebPage.name) private webPageModel: Model<WebPage>,
    @InjectModel(Guest.name) private guestModel: Model<Guest>,
    @InjectModel(Wedding.name) private weddingModel: Model<Wedding>,
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
        heroImage: webPage.heroImage || '',
        heroImagePosition: (webPage as any).heroImagePosition || 'center center',
        galleryImages: webPage.galleryImages || [],
        rsvpEnabled: webPage.rsvpEnabled,
        rsvpDeadline: webPage.rsvpDeadline,
        mealOptions: webPage.mealOptions || [],
        transportOptions: webPage.transportOptions || [],
        confirmMessage: webPage.confirmMessage || '',
        rejectMessage: webPage.rejectMessage || '',
        heroTitle: webPage.heroTitle,
        heroSubtitle: webPage.heroSubtitle,
        storyTitle: webPage.storyTitle || '',
        storyText: webPage.storyText,
        scheduleTitle: webPage.scheduleTitle || '',
        scheduleText: webPage.scheduleText,
        scheduleStyle: (webPage as any).scheduleStyle || 'B',
        locationTitle: webPage.locationTitle || '',
        locationText: webPage.locationText,
        transportTitle: webPage.transportTitle || '',
        transportText: webPage.transportText,
        accommodationTitle: webPage.accommodationTitle || '',
        accommodationText: webPage.accommodationText,
        dressCodeTitle: webPage.dressCodeTitle || '',
        dressCode: webPage.dressCode,
        customSections: webPage.customSections,
        visibleSections: webPage.visibleSections || {},
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

  async findGuestByToken(token: string) {
    const guest = await this.guestModel.findOne({ invitationToken: token }).lean();
    if (!guest) throw new NotFoundException('Token de invitación no válido');

    const wedding = await this.weddingModel.findById(guest.weddingId).lean<Wedding>();
    if (!wedding) throw new NotFoundException('Boda no encontrada');

    const webPage = await this.webPageModel.findOne({ weddingId: guest.weddingId }).lean();

    const groupMembers = guest.groupId
      ? await this.guestModel.find({ groupId: guest.groupId }).lean()
      : [];

    return {
      guest: this.guestToPublic(guest),
      group: guest.groupId
        ? { id: guest.groupId.toString(), members: groupMembers.map((m) => this.guestToPublic(m)) }
        : null,
      wedding: {
        slug: wedding.slug,
        partner1Name: wedding.partner1Name,
        partner2Name: wedding.partner2Name,
        date: wedding.date,
        venue: wedding.venue,
        mealOptions: webPage?.mealOptions ?? wedding.mealOptions ?? [],
        allergyOptions: wedding.allergyOptions ?? [],
        transportOptions: webPage?.transportOptions ?? wedding.transportOptions ?? [],
        confirmMessage: webPage?.confirmMessage ?? '',
        rejectMessage: webPage?.rejectMessage ?? '',
      },
      token: guest.invitationToken ?? '',
    };
  }

  async lookupGuest(slug: string, dto: RsvpLookupDto) {
    const wedding = await this.weddingModel.findOne({ slug }).lean<Wedding>();
    if (!wedding) throw new NotFoundException('Boda no encontrada');

    const nameParts = dto.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const query: Record<string, unknown> = {
      weddingId: wedding._id,
      email: new RegExp(`^${dto.email.trim()}$`, 'i'),
      firstName: new RegExp(`^${firstName}$`, 'i'),
    };
    if (lastName) query.lastName = new RegExp(`^${lastName}$`, 'i');

    const guest = await this.guestModel.findOne(query).lean();
    if (!guest) throw new NotFoundException('No te encontramos en la lista de invitados');

    return this.findGuestByToken(guest.invitationToken ?? `${guest._id}`);
  }

  async lookupByEmail(slug: string, email: string) {
    const wedding = await this.weddingModel.findOne({ slug }).lean<Wedding>();
    if (!wedding) throw new NotFoundException('Boda no encontrada');

    const guest = await this.guestModel
      .findOne({ weddingId: wedding._id, email: new RegExp(`^${email.trim()}$`, 'i') })
      .lean();
    if (!guest) throw new NotFoundException('No estás en la lista de invitados');

    return this.findGuestByToken(guest.invitationToken ?? `${guest._id}`);
  }

  async submitGroupRsvp(slug: string, dto: GroupRsvpDto) {
    const guest = await this.guestModel.findOne({ invitationToken: dto.token }).lean();
    if (!guest) throw new NotFoundException('Token de invitación no válido');

    const wedding = await this.weddingModel.findOne({ slug }).lean<Wedding>();
    if (!wedding) throw new NotFoundException('Boda no encontrada');
    if (guest.weddingId.toString() !== wedding._id.toString()) throw new BadRequestException('Token inválido para esta boda');

    await Promise.all(
      dto.responses.map(async (r) => {
        const member = await this.guestModel.findById(r.guestId);
        if (!member || member.weddingId.toString() !== wedding._id.toString()) return;
        member.rsvpStatus = r.rsvpStatus === 'confirmed' ? RsvpStatus.CONFIRMED : RsvpStatus.REJECTED;
        if (r.mealChoice) member.mealChoice = r.mealChoice;
        if (r.allergies !== undefined) member.allergies = r.allergies;
        if (r.transport !== undefined) member.transport = r.transport;
        if (r.transportPickupPoint) member.transportPickupPoint = r.transportPickupPoint;
        member.rsvpHistory.push({
          rsvpStatus: member.rsvpStatus,
          mealChoice: r.mealChoice,
          allergies: r.allergies,
          transport: r.transport,
          transportPickupPoint: r.transportPickupPoint,
          respondedAt: new Date(),
          source: 'GUEST_WEB',
        });
        await member.save();
      }),
    );

    // Registrar alergias personalizadas que no existen aún en el sistema
    const existingAllergies = wedding.allergyOptions ?? [];
    const submittedAllergies = dto.responses
      .filter((r) => r.rsvpStatus === 'confirmed' && r.allergies)
      .flatMap((r) => r.allergies!.split(', ').map((a) => a.trim()).filter(Boolean));
    const newAllergies = [...new Set(submittedAllergies)].filter(
      (a) => !existingAllergies.includes(a),
    );
    if (newAllergies.length > 0) {
      await this.weddingModel.findByIdAndUpdate(
        wedding._id,
        { $addToSet: { allergyOptions: { $each: newAllergies } } },
      );
    }

    return { success: true };
  }

  private guestToPublic(g: Record<string, unknown>) {
    return {
      id: (g._id as Types.ObjectId).toString(),
      firstName: g.firstName,
      lastName: g.lastName,
      rsvpStatus: g.rsvpStatus,
      mealChoice: g.mealChoice,
      allergies: g.allergies,
      transport: g.transport,
      transportPickupPoint: g.transportPickupPoint,
      groupId: g.groupId ? (g.groupId as Types.ObjectId).toString() : null,
    };
  }

  toResponse(page: WebPage) {
    return {
      id: page._id.toString(),
      templateId: page.templateId,
      colorPalette: page.colorPalette,
      fontTitle: page.fontTitle,
      fontBody: page.fontBody,
      heroImage: page.heroImage || '',
      heroImagePosition: (page as any).heroImagePosition || 'center center',
      galleryImages: page.galleryImages || [],
      rsvpEnabled: page.rsvpEnabled,
      rsvpDeadline: page.rsvpDeadline?.toISOString?.()?.split('T')[0] || null,
      mealOptions: page.mealOptions || [],
      transportOptions: page.transportOptions || [],
      confirmMessage: page.confirmMessage || '',
      rejectMessage: page.rejectMessage || '',
      heroTitle: page.heroTitle,
      heroSubtitle: page.heroSubtitle,
      storyTitle: page.storyTitle || '',
      storyText: page.storyText,
      scheduleTitle: page.scheduleTitle || '',
      scheduleText: page.scheduleText,
      scheduleStyle: (page as any).scheduleStyle || 'B',
      locationTitle: page.locationTitle || '',
      locationText: page.locationText,
      transportTitle: page.transportTitle || '',
      transportText: page.transportText,
      accommodationTitle: page.accommodationTitle || '',
      accommodationText: page.accommodationText,
      dressCodeTitle: page.dressCodeTitle || '',
      dressCode: page.dressCode,
      customSections: page.customSections,
      visibleSections: page.visibleSections || {},
      isPublished: page.isPublished,
      publishedAt: page.publishedAt?.toISOString?.() || null,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Guest } from './schemas/guest.schema';
import { GuestGroup } from './schemas/guest-group.schema';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { KtpMailerService } from '../mailer/ktp-mailer.service';
import { ConfigService } from '@nestjs/config';
import { Wedding } from '../wedding/schemas/wedding.schema';

@Injectable()
export class GuestService {
  constructor(
    @InjectModel(Guest.name) private guestModel: Model<Guest>,
    @InjectModel(GuestGroup.name) private groupModel: Model<GuestGroup>,
    @InjectModel(Wedding.name) private weddingModel: Model<Wedding>,
    private readonly mailerService: KtpMailerService,
    private readonly config: ConfigService,
  ) {}

  async findAll(
    weddingId: string,
    filters?: {
      rsvp?: string;
      search?: string;
      list?: string;
    },
  ): Promise<Guest[]> {
    const query: Record<string, unknown> = {
      weddingId: new Types.ObjectId(weddingId),
    };

    if (filters?.rsvp) query.rsvpStatus = filters.rsvp;
    if (filters?.list) query.listName = filters.list;
    if (filters?.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.guestModel.find(query).sort({ createdAt: 1 });
  }

  async create(weddingId: string, dto: CreateGuestDto): Promise<Guest> {
    return this.guestModel.create({
      weddingId: new Types.ObjectId(weddingId),
      ...dto,
      groupId: dto.groupId ? new Types.ObjectId(dto.groupId) : undefined,
    });
  }

  async update(
    guestId: string,
    weddingId: string,
    dto: UpdateGuestDto,
  ): Promise<Guest> {
    const guest = await this.guestModel.findById(guestId);
    if (!guest) throw new NotFoundException('Invitado no encontrado');
    if (guest.weddingId.toString() !== weddingId) throw new ForbiddenException();

    const { _source = 'ADMIN_PANEL', _changedBy, ...fields } = dto as UpdateGuestDto & { _source?: string; _changedBy?: string };
    const setData: Record<string, unknown> = { ...fields };
    if (fields.groupId) setData.groupId = new Types.ObjectId(fields.groupId);

    const trackable = ['firstName', 'lastName', 'email', 'rsvpStatus', 'mealChoice',
      'allergies', 'transport', 'transportPickupPoint', 'listName', 'role', 'notes', 'address'];
    const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];
    for (const field of trackable) {
      if (field in setData && (guest as unknown as Record<string, unknown>)[field] !== setData[field]) {
        changes.push({ field, oldValue: (guest as unknown as Record<string, unknown>)[field], newValue: setData[field] });
      }
    }

    const auditEntry = {
      id: new Types.ObjectId().toString(),
      timestamp: new Date(),
      source: _source,
      changedBy: _changedBy,
      changes,
    };

    const updated = await this.guestModel.findByIdAndUpdate(
      guestId,
      { $set: setData, $push: { auditLog: auditEntry } },
      { new: true },
    );
    return updated!;
  }

  async getHistory(guestId: string, weddingId: string) {
    const guest = await this.guestModel.findById(guestId);
    if (!guest) throw new NotFoundException('Invitado no encontrado');
    if (guest.weddingId.toString() !== weddingId) throw new ForbiddenException();
    return {
      guestId: guest._id.toString(),
      name: `${guest.firstName} ${guest.lastName}`.trim(),
      auditLog: (guest.auditLog || []).map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
        source: e.source,
        changedBy: e.changedBy,
        changes: e.changes,
      })),
    };
  }

  async delete(guestId: string, weddingId: string): Promise<void> {
    const guest = await this.guestModel.findById(guestId);
    if (!guest) throw new NotFoundException('Invitado no encontrado');
    if (guest.weddingId.toString() !== weddingId) {
      throw new ForbiddenException();
    }
    await this.guestModel.findByIdAndDelete(guestId);
  }

  async getStats(weddingId: string) {
    const guests = await this.guestModel.find({
      weddingId: new Types.ObjectId(weddingId),
    });
    return {
      total: guests.length,
      confirmed: guests.filter((g) => g.rsvpStatus === 'confirmed').length,
      pending: guests.filter((g) => g.rsvpStatus === 'pending').length,
      rejected: guests.filter((g) => g.rsvpStatus === 'rejected').length,
    };
  }

  async sendInvitation(guestId: string, weddingId: string): Promise<{ sent: boolean; email: string }> {
    const guest = await this.guestModel.findById(guestId);
    if (!guest) throw new NotFoundException('Invitado no encontrado');
    if (guest.weddingId.toString() !== weddingId) throw new ForbiddenException();
    if (!guest.email) throw new BadRequestException('El invitado no tiene email registrado');

    const wedding = await this.weddingModel.findById(weddingId).lean<Wedding>();
    if (!wedding) throw new NotFoundException('Boda no encontrada');

    const token = guest.invitationToken ?? randomUUID();
    if (!guest.invitationToken) {
      await this.guestModel.findByIdAndUpdate(guestId, { invitationToken: token });
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const rsvpUrl = `${frontendUrl}/${wedding.slug}?token=${token}`;
    const dateStr = wedding.date
      ? new Date(wedding.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    // Fire-and-forget: no bloquear la respuesta HTTP esperando al SMTP
    this.mailerService.sendInvitation({
      to: guest.email,
      guestName: `${guest.firstName} ${guest.lastName}`.trim(),
      partner1Name: wedding.partner1Name,
      partner2Name: wedding.partner2Name,
      weddingDate: dateStr,
      weddingVenue: wedding.venue || '',
      rsvpUrl,
    }).catch((err) => console.error(`[mail] Error enviando invitación a ${guest.email}:`, err));

    await this.guestModel.findByIdAndUpdate(guestId, { invitationSent: true, invitationToken: token });
    return { sent: true, email: guest.email };
  }

  async sendBulkInvitations(guestIds: string[], weddingId: string) {
    const results = await Promise.allSettled(
      guestIds.map((id) => this.sendInvitation(id, weddingId)),
    );
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => String(r.reason?.message ?? r.reason));
    return { sent, failed: errors.length, errors };
  }

  async findByToken(token: string) {
    return this.guestModel.findOne({ invitationToken: token }).lean();
  }

  toResponse(guest: Guest) {
    return {
      id: guest._id.toString(),
      name: `${guest.firstName} ${guest.lastName}`.trim(),
      lastName: guest.lastName || '',
      email: guest.email || '',
      phone: guest.phone,
      address: guest.address,
      groupId: guest.groupId?.toString() || '',
      listName: guest.listName || 'A',
      rsvp: guest.rsvpStatus,
      dish: guest.mealChoice || '',
      allergies: guest.allergies || '',
      transport: guest.transport,
      transportPickupPoint: guest.transportPickupPoint,
      plusOne: guest.plusOne,
      invitationSent: guest.invitationSent ?? false,
      role: guest.role || '',
      notes: guest.notes,
    };
  }

  // --- Guest Groups ---

  async findAllGroups(weddingId: string): Promise<GuestGroup[]> {
    return this.groupModel
      .find({ weddingId: new Types.ObjectId(weddingId) })
      .sort({ createdAt: 1 });
  }

  async createGroup(
    weddingId: string,
    name: string,
  ): Promise<GuestGroup> {
    return this.groupModel.create({
      weddingId: new Types.ObjectId(weddingId),
      name,
    });
  }

  async updateGroup(
    groupId: string,
    weddingId: string,
    name: string,
  ): Promise<GuestGroup> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (group.weddingId.toString() !== weddingId) {
      throw new ForbiddenException();
    }
    group.name = name;
    return group.save();
  }

  async deleteGroup(groupId: string, weddingId: string): Promise<void> {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Grupo no encontrado');
    if (group.weddingId.toString() !== weddingId) {
      throw new ForbiddenException();
    }
    // Unassign guests from this group
    await this.guestModel.updateMany(
      { groupId: new Types.ObjectId(groupId) },
      { $unset: { groupId: 1 } },
    );
    await this.groupModel.findByIdAndDelete(groupId);
  }

  groupToResponse(group: GuestGroup) {
    return {
      id: group._id.toString(),
      name: group.name,
    };
  }
}

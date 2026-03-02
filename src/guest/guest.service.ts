import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Guest } from './schemas/guest.schema';
import { GuestGroup } from './schemas/guest-group.schema';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';

@Injectable()
export class GuestService {
  constructor(
    @InjectModel(Guest.name) private guestModel: Model<Guest>,
    @InjectModel(GuestGroup.name) private groupModel: Model<GuestGroup>,
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
    if (guest.weddingId.toString() !== weddingId) {
      throw new ForbiddenException();
    }

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.groupId) updateData.groupId = new Types.ObjectId(dto.groupId);

    const updated = await this.guestModel.findByIdAndUpdate(
      guestId,
      updateData,
      { new: true },
    );
    return updated!;
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

  toResponse(guest: Guest) {
    return {
      id: guest._id.toString(),
      name: `${guest.firstName} ${guest.lastName}`.trim(),
      email: guest.email || '',
      phone: guest.phone,
      groupId: guest.groupId?.toString() || '',
      rsvp: guest.rsvpStatus,
      dish: guest.mealChoice || '',
      allergies: guest.allergies || '',
      transport: guest.transport,
      plusOne: guest.plusOne,
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

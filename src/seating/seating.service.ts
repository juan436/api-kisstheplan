import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SeatingPlan,
  TableSeat,
  SeatAssignment,
  DecorationObject,
  CalibZone,
  CustomEmoji,
} from './schemas/seating-plan.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { PlanUpdateFields } from './interfaces/seating-update.interface';

@Injectable()
export class SeatingService {
  constructor(
    @InjectModel(SeatingPlan.name) private planModel: Model<SeatingPlan>,
  ) {}

  async findPlans(weddingId: string) {
    return this.planModel
      .find({ weddingId: new Types.ObjectId(weddingId) })
      .sort({ createdAt: 1 });
  }

  async createPlan(weddingId: string, dto: CreatePlanDto) {
    return this.planModel.create({
      weddingId: new Types.ObjectId(weddingId),
      name: dto.name,
      tables: [],
    });
  }

  async updatePlan(id: string, weddingId: string, dto: UpdatePlanDto) {
    const updateFields: PlanUpdateFields = {};
    if (dto.name !== undefined) updateFields.name = dto.name;
    if (dto.backgroundImageUrl !== undefined) updateFields.backgroundImageUrl = dto.backgroundImageUrl;
    if (dto.scaleFactor !== undefined) updateFields.scaleFactor = dto.scaleFactor;
    if (dto.decorations !== undefined) updateFields.decorations = dto.decorations;
    if (dto.zones !== undefined) updateFields.zones = dto.zones;
    if (dto.customEmojis !== undefined) updateFields.customEmojis = dto.customEmojis;

    const plan = await this.planModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(weddingId) },
      { $set: updateFields },
      { new: true },
    );
    if (!plan) throw new NotFoundException('Plan de mesas no encontrado');
    return plan;
  }

  async deletePlan(id: string, weddingId: string) {
    const result = await this.planModel.deleteOne({
      _id: new Types.ObjectId(id),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Plan de mesas no encontrado');
  }

  async addTable(planId: string, weddingId: string, dto: CreateTableDto) {
    // Build empty assignments array based on capacity
    const assignments = Array.from({ length: dto.capacity }, (_, i) => ({
      _id: new Types.ObjectId(),
      seatNumber: i + 1,
      guestId: null,
    }));

    const plan = await this.planModel.findOneAndUpdate(
      { _id: new Types.ObjectId(planId), weddingId: new Types.ObjectId(weddingId) },
      {
        $push: {
          tables: {
            _id: new Types.ObjectId(),
            name: dto.name,
            shape: dto.shape,
            capacity: dto.capacity,
            posX: dto.posX,
            posY: dto.posY,
            assignments,
          },
        },
      },
      { new: true },
    );
    if (!plan) throw new NotFoundException('Plan de mesas no encontrado');
    return plan;
  }

  async updateTable(planId: string, tableId: string, weddingId: string, dto: UpdateTableDto) {
    const plan = await this.planModel.findOne({
      _id: new Types.ObjectId(planId),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (!plan) throw new NotFoundException('Plan de mesas no encontrado');

    const table = plan.tables.find((t) => t._id.toString() === tableId);
    if (!table) throw new NotFoundException('Mesa no encontrada');

    if (dto.name !== undefined) table.name = dto.name;
    if (dto.shape !== undefined) table.shape = dto.shape;
    if (dto.posX !== undefined) table.posX = dto.posX;
    if (dto.posY !== undefined) table.posY = dto.posY;
    if (dto.rotation !== undefined) table.rotation = dto.rotation;
    if (dto.physicalDiameter !== undefined) table.physicalDiameter = dto.physicalDiameter;
    if (dto.physicalWidth !== undefined) table.physicalWidth = dto.physicalWidth;
    if (dto.physicalHeight !== undefined) table.physicalHeight = dto.physicalHeight;

    // If capacity changed, rebuild assignments preserving existing ones
    if (dto.capacity !== undefined && dto.capacity !== table.capacity) {
      const oldAssignments = table.assignments || [];
      const newAssignments = Array.from({ length: dto.capacity }, (_, i) => {
        const existing = oldAssignments.find((a) => a.seatNumber === i + 1);
        return existing ?? {
          _id: new Types.ObjectId(),
          seatNumber: i + 1,
          guestId: null,
        };
      });
      table.assignments = newAssignments as SeatAssignment[];
      table.capacity = dto.capacity;
    }

    await plan.save();
    return plan;
  }

  async deleteTable(planId: string, tableId: string, weddingId: string) {
    const plan = await this.planModel.findOneAndUpdate(
      { _id: new Types.ObjectId(planId), weddingId: new Types.ObjectId(weddingId) },
      { $pull: { tables: { _id: new Types.ObjectId(tableId) } } },
      { new: true },
    );
    if (!plan) throw new NotFoundException('Plan de mesas no encontrado');
    return plan;
  }

  async assignGuest(
    planId: string,
    tableId: string,
    seatNumber: number,
    weddingId: string,
    guestId?: string,
  ) {
    const plan = await this.planModel.findOne({
      _id: new Types.ObjectId(planId),
      weddingId: new Types.ObjectId(weddingId),
    });
    if (!plan) throw new NotFoundException('Plan de mesas no encontrado');

    const table = plan.tables.find((t) => t._id.toString() === tableId);
    if (!table) throw new NotFoundException('Mesa no encontrada');

    const seat = table.assignments.find((a) => a.seatNumber === seatNumber);
    if (!seat) throw new NotFoundException('Asiento no encontrado');

    // A guest can only occupy one seat within this plan at a time — clear any other seat they held before reassigning.
    if (guestId) {
      for (const t of plan.tables) {
        for (const a of t.assignments) {
          if (a.guestId?.toString() === guestId && a !== seat) {
            a.guestId = undefined;
          }
        }
      }
    }

    seat.guestId = guestId ? new Types.ObjectId(guestId) : undefined;

    await plan.save();
    return plan;
  }

  toResponse(plan: SeatingPlan) {
    return {
      id: (plan._id as Types.ObjectId).toString(),
      name: plan.name,
      backgroundImageUrl: plan.backgroundImageUrl || undefined,
      scaleFactor: plan.scaleFactor || undefined,
      decorations: (plan.decorations || []).map((d: DecorationObject) => ({
        id: d.id,
        type: d.type,
        posX: d.posX,
        posY: d.posY,
        label: d.label || undefined,
        physicalWidth: d.physicalWidth || undefined,
        physicalHeight: d.physicalHeight || undefined,
        customEmoji: d.customEmoji || undefined,
        objectType: d.objectType || undefined,
        guestId: d.guestId || undefined,
      })),
      customEmojis: (plan.customEmojis || []).map((e: CustomEmoji) => ({
        id: e.id,
        emoji: e.emoji || undefined,
        objectType: e.objectType || undefined,
        label: e.label,
        physicalWidth: e.physicalWidth,
        physicalHeight: e.physicalHeight,
      })),
      zones: (plan.zones || []).map((z: CalibZone) => ({
        id: z.id,
        points: z.points,
        physicalWidth: z.physicalWidth,
        physicalHeight: z.physicalHeight,
        localScale: z.localScale,
      })),
      tables: (plan.tables || []).map((t: TableSeat) => ({
        id: t._id.toString(),
        name: t.name,
        shape: t.shape === 'rect' ? 'rectangular' : t.shape,
        capacity: t.capacity,
        posX: t.posX,
        posY: t.posY,
        rotation: t.rotation ?? 0,
        physicalDiameter: t.physicalDiameter ?? undefined,
        physicalWidth: t.physicalWidth ?? undefined,
        physicalHeight: t.physicalHeight ?? undefined,
        assignments: (t.assignments || []).map((a: SeatAssignment) => ({
          seatNumber: a.seatNumber,
          guestId: a.guestId ? a.guestId.toString() : undefined,
        })),
      })),
    };
  }
}

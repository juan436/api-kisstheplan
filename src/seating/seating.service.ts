import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SeatingPlan } from './schemas/seating-plan.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';

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
    const plan = await this.planModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), weddingId: new Types.ObjectId(weddingId) },
      { $set: { name: dto.name } },
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
      table.assignments = newAssignments as any;
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

    seat.guestId = guestId ? (new Types.ObjectId(guestId) as any) : (null as any);

    await plan.save();
    return plan;
  }

  toResponse(plan: SeatingPlan) {
    const p = plan as any;
    return {
      id: p._id.toString(),
      name: plan.name,
      tables: (plan.tables || []).map((t) => ({
        id: t._id.toString(),
        name: t.name,
        // Map backend 'rect' → frontend 'rectangular' for TypeScript compatibility
        shape: t.shape === 'rect' ? 'rectangular' : t.shape,
        capacity: t.capacity,
        posX: t.posX,
        posY: t.posY,
        assignments: (t.assignments || []).map((a) => ({
          seatNumber: a.seatNumber,
          guestId: a.guestId ? a.guestId.toString() : undefined,
        })),
      })),
    };
  }
}

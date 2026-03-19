import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: true })
export class SeatAssignment {
  _id: Types.ObjectId;

  @Prop({ required: true })
  seatNumber: number;

  @Prop({ type: Types.ObjectId, ref: 'Guest', default: null })
  guestId?: Types.ObjectId;
}

export const SeatAssignmentSchema = SchemaFactory.createForClass(SeatAssignment);

@Schema({ _id: true })
export class TableSeat {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: ['round', 'rect'], default: 'round' })
  shape: 'round' | 'rect';

  @Prop({ default: 8 })
  capacity: number;

  @Prop({ default: 100 })
  posX: number;

  @Prop({ default: 100 })
  posY: number;

  @Prop({ type: [SeatAssignmentSchema], default: [] })
  assignments: SeatAssignment[];
}

export const TableSeatSchema = SchemaFactory.createForClass(TableSeat);

@Schema({ timestamps: true })
export class SeatingPlan extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, index: true })
  weddingId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: [TableSeatSchema], default: [] })
  tables: TableSeat[];
}

export const SeatingPlanSchema = SchemaFactory.createForClass(SeatingPlan);

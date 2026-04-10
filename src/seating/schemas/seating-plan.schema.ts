import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ── CalibZone sub-schemas ─────────────────────────────────────────────────────

@Schema({ _id: false })
class ZonePoint {
  @Prop({ required: true }) x: number;
  @Prop({ required: true }) y: number;
}
const ZonePointSchema = SchemaFactory.createForClass(ZonePoint);

@Schema({ _id: false })
export class CalibZone {
  @Prop({ required: true }) id: string;
  @Prop({ type: [ZonePointSchema], required: true }) points: ZonePoint[];
  @Prop({ required: true }) physicalWidth: number;
  @Prop({ required: true }) physicalHeight: number;
  @Prop({ required: true }) localScale: number;
}
export const CalibZoneSchema = SchemaFactory.createForClass(CalibZone);

// ── Decoration sub-schema ─────────────────────────────────────────────────────

@Schema({ _id: false })
export class DecorationObject {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  type: string;

  @Prop({ default: 0 })
  posX: number;

  @Prop({ default: 0 })
  posY: number;

  @Prop({ default: null })
  label?: string;

  @Prop({ default: null })
  physicalWidth?: number;

  @Prop({ default: null })
  physicalHeight?: number;
}

export const DecorationObjectSchema = SchemaFactory.createForClass(DecorationObject);

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

  @Prop({ default: 0 })
  rotation: number;

  @Prop({ type: Number, default: null })
  physicalDiameter?: number;

  @Prop({ type: Number, default: null })
  physicalWidth?: number;

  @Prop({ type: Number, default: null })
  physicalHeight?: number;

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

  @Prop({ default: null })
  backgroundImageUrl?: string;

  @Prop({ default: null })
  scaleFactor?: number;

  @Prop({ type: [DecorationObjectSchema], default: [] })
  decorations: DecorationObject[];

  @Prop({ type: [CalibZoneSchema], default: [] })
  zones: CalibZone[];
}

export const SeatingPlanSchema = SchemaFactory.createForClass(SeatingPlan);

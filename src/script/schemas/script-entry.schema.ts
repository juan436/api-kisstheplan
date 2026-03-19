import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimeType = 'exact' | 'range' | 'none';

@Schema({ timestamps: true })
export class ScriptEntry extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, index: true })
  weddingId: Types.ObjectId;

  @Prop({ enum: ['exact', 'range', 'none'], default: 'none' })
  timeType: TimeType;

  @Prop({ trim: true })
  timeStart?: string; // e.g. "09:00"

  @Prop({ trim: true })
  timeEnd?: string; // e.g. "10:30" (only for range)

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  // Style overrides stored as JSON
  @Prop({ type: Object, default: {} })
  style: {
    bold?: boolean;
    color?: string;
    fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  };

  @Prop({ default: 0 })
  order: number;
}

export const ScriptEntrySchema = SchemaFactory.createForClass(ScriptEntry);

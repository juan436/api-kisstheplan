import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ScriptArea extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, index: true })
  weddingId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ default: 0 })
  order: number;
}

export const ScriptAreaSchema = SchemaFactory.createForClass(ScriptArea);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class GuestGroup extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, index: true })
  weddingId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;
}

export const GuestGroupSchema = SchemaFactory.createForClass(GuestGroup);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Lead extends Document {
  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);

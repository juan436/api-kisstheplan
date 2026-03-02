import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wedding extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ required: true, trim: true })
  partner1Name: string;

  @Prop({ trim: true })
  partner1Last?: string;

  @Prop({ required: true, trim: true })
  partner2Name: string;

  @Prop({ trim: true })
  partner2Last?: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, trim: true })
  venue: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ default: 0 })
  estimatedGuests: number;

  @Prop({ default: 0 })
  estimatedBudget: number;

  @Prop({ default: 'EUR' })
  currency: string;

  @Prop()
  photoUrl?: string;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ type: [String], default: ['Carne', 'Pescado', 'Vegetariano', 'Infantil'] })
  mealOptions: string[];

  @Prop({ type: [String], default: [] })
  transportOptions: string[];
}

export const WeddingSchema = SchemaFactory.createForClass(Wedding);

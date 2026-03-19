import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: true })
export class MoodboardColor {
  _id: Types.ObjectId;
  @Prop({ required: true }) hexColor: string;
  @Prop() name?: string;
  @Prop({ default: 0 }) order: number;
}
export const MoodboardColorSchema = SchemaFactory.createForClass(MoodboardColor);

@Schema({ _id: true })
export class MoodboardImage {
  _id: Types.ObjectId;
  @Prop({ required: true }) url: string;
  @Prop() caption?: string;
  @Prop({ default: 0 }) order: number;
}
export const MoodboardImageSchema = SchemaFactory.createForClass(MoodboardImage);

@Schema({ _id: true })
export class MoodboardCategory {
  _id: Types.ObjectId;
  @Prop({ required: true }) name: string;
  @Prop({ type: [MoodboardImageSchema], default: [] }) images: MoodboardImage[];
  @Prop({ default: 0 }) order: number;
}
export const MoodboardCategorySchema = SchemaFactory.createForClass(MoodboardCategory);

@Schema({ timestamps: true })
export class Note extends Document {
  @Prop({ type: Types.ObjectId, required: true }) weddingId: Types.ObjectId;
  @Prop({ enum: ['text', 'pdf', 'moodboard'], required: true }) type: string;
  @Prop({ required: true }) title: string;
  @Prop({ type: Types.ObjectId, default: null }) vendorId?: Types.ObjectId;
  @Prop({ default: '' }) content: string; // HTML for text, fileUrl for PDF
  @Prop({ type: [MoodboardColorSchema], default: [] }) colorPalette: MoodboardColor[];
  @Prop({ type: [MoodboardCategorySchema], default: [] }) categories: MoodboardCategory[];
  createdAt: Date;
  updatedAt: Date;
}
export const NoteSchema = SchemaFactory.createForClass(Note);

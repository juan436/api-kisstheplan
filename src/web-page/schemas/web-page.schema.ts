import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class WebPage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, unique: true, index: true })
  weddingId: Types.ObjectId;

  // Design
  @Prop({ default: 'classic' })
  templateId: string;

  @Prop({ type: Object, default: { primary: '#C4B7A6', accent: '#c7a977', bg: '#FAF7F2', text: '#4A3C32' } })
  colorPalette: Record<string, string>;

  @Prop({ default: 'Playfair Display' })
  fontTitle: string;

  @Prop({ default: 'Quicksand' })
  fontBody: string;

  @Prop({ default: '' })
  heroImage: string;

  @Prop({ default: 'center center' })
  heroImagePosition: string;

  @Prop({ type: [String], default: [] })
  galleryImages: string[];

  // RSVP config
  @Prop({ default: true })
  rsvpEnabled: boolean;

  @Prop({ type: Date })
  rsvpDeadline: Date;

  @Prop({ type: [String], default: [] })
  mealOptions: string[];

  @Prop({ type: [String], default: [] })
  allergyOptions: string[];

  @Prop({ type: [String], default: [] })
  transportOptions: string[];

  @Prop({ default: '' })
  confirmMessage: string;

  @Prop({ default: '' })
  rejectMessage: string;

  // Content
  @Prop({ default: '' })
  heroTitle: string;

  @Prop({ default: '' })
  heroSubtitle: string;

  @Prop({ default: '' })
  storyTitle: string;

  @Prop({ default: '' })
  storyText: string;

  @Prop({ default: '' })
  scheduleTitle: string;

  @Prop({ default: '' })
  scheduleText: string;

  @Prop({ default: 'B' })
  scheduleStyle: string;

  @Prop({ default: '' })
  locationTitle: string;

  @Prop({ default: '' })
  locationText: string;

  @Prop({ default: '' })
  transportTitle: string;

  @Prop({ default: '' })
  transportText: string;

  @Prop({ default: '' })
  accommodationTitle: string;

  @Prop({ default: '' })
  accommodationText: string;

  @Prop({ default: '' })
  dressCodeTitle: string;

  @Prop({ default: '' })
  dressCode: string;

  @Prop({ type: [Object], default: [] })
  customSections: Array<{ title: string; content: string }>;

  @Prop({ type: Object, default: {} })
  visibleSections: Record<string, boolean>;

  // Publish
  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ type: Date })
  publishedAt: Date;
}

export const WebPageSchema = SchemaFactory.createForClass(WebPage);

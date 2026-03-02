import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RsvpStatus {
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

export enum GuestRole {
  GROOM = 'groom',
  BRIDE = 'bride',
  FAMILY_GROOM = 'family_groom',
  FAMILY_BRIDE = 'family_bride',
  CHILD = 'child',
  BABY = 'baby',
}

@Schema({ timestamps: true })
export class Guest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, index: true })
  weddingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'GuestGroup' })
  groupId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ trim: true, default: '' })
  lastName: string;

  @Prop({ trim: true, default: '' })
  email: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ default: '' })
  mealChoice: string;

  @Prop({ default: '' })
  allergies: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ default: false })
  transport: boolean;

  @Prop({ trim: true })
  transportPickupPoint?: string;

  @Prop({ default: false })
  plusOne: boolean;

  @Prop({ default: 'A' })
  listName: string;

  @Prop({ enum: RsvpStatus, default: RsvpStatus.PENDING })
  rsvpStatus: RsvpStatus;

  @Prop({ enum: GuestRole })
  role?: GuestRole;

  @Prop()
  notes?: string;
}

export const GuestSchema = SchemaFactory.createForClass(Guest);

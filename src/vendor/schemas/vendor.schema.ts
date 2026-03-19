import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: true })
export class VendorPayment {
  _id: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop()
  dueDate?: Date;

  @Prop({ default: false })
  paid: boolean;

  @Prop({ default: '' })
  notes: string;
}

export const VendorPaymentSchema = SchemaFactory.createForClass(VendorPayment);

@Schema({ _id: true })
export class VendorActivity {
  _id: Types.ObjectId;

  @Prop({ required: true, enum: ['note', 'file'] })
  type: string;

  @Prop({ default: '' })
  content: string;

  @Prop()
  fileUrl?: string;

  @Prop()
  fileName?: string;

  @Prop({ default: 'Tú' })
  author: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const VendorActivitySchema = SchemaFactory.createForClass(VendorActivity);

@Schema({ timestamps: true })
export class Vendor extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, index: true })
  weddingId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ enum: ['confirmed', 'considering'], default: 'considering' })
  status: string;

  @Prop({ trim: true })
  contactName?: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  web?: string;

  @Prop({ trim: true })
  social?: string;

  @Prop()
  contractUrl?: string;

  @Prop({ default: false })
  needsStaffMenu: boolean;

  @Prop()
  staffCount?: number;

  @Prop()
  staffAllergies?: string;

  @Prop({ default: '' })
  notes: string;

  @Prop({ type: [VendorPaymentSchema], default: [] })
  payments: VendorPayment[];

  @Prop({ type: [VendorActivitySchema], default: [] })
  activity: VendorActivity[];
}

export const VendorSchema = SchemaFactory.createForClass(Vendor);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PaymentSchedule extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, index: true })
  weddingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ExpenseCategory' })
  categoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendorId?: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  vendorName: string;

  @Prop({ trim: true, default: '' })
  concept: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  dueDate: Date;

  @Prop()
  paidAt?: Date;

  @Prop()
  notes?: string;
}

export const PaymentScheduleSchema = SchemaFactory.createForClass(PaymentSchedule);

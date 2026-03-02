import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: true })
export class ExpenseItem {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  concept: string;

  @Prop({ default: 0 })
  estimated: number;

  @Prop({ default: 0 })
  actual: number;

  @Prop({ default: 0 })
  paid: number;
}

export const ExpenseItemSchema = SchemaFactory.createForClass(ExpenseItem);

@Schema({ timestamps: true })
export class ExpenseCategory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, index: true })
  weddingId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ type: [ExpenseItemSchema], default: [] })
  items: ExpenseItem[];
}

export const ExpenseCategorySchema = SchemaFactory.createForClass(ExpenseCategory);

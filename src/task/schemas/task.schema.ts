import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TaskStatus {
  DONE = 'done',
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
}

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, index: true })
  weddingId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  category?: string;

  @Prop({ trim: true })
  stage?: string;

  @Prop()
  dueDate?: Date;

  @Prop({ enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Prop()
  completedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Collaborator' })
  assignedToId?: Types.ObjectId;

  @Prop()
  notes?: string;

  @Prop({ default: false })
  isCustom: boolean;

  @Prop({ default: 0 })
  order: number;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

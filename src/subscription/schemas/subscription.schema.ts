import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Wedding', required: true, unique: true })
  weddingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['trial', 'active', 'expired', 'cancelled'], default: 'trial' })
  status: 'trial' | 'active' | 'expired' | 'cancelled';

  @Prop({ type: String, enum: ['trial', 'annual'], required: true })
  plan: 'trial' | 'annual';

  @Prop({ type: Date, default: null })
  trialStartDate: Date | null;

  @Prop({ type: Date, default: null })
  trialEndDate: Date | null;

  @Prop({ type: Date, default: null })
  currentPeriodStart: Date | null;

  @Prop({ type: Date, default: null })
  currentPeriodEnd: Date | null;

  @Prop({ type: Number, default: null })
  amount: number | null;

  @Prop({ type: String, default: 'EUR' })
  currency: string;

  @Prop({ type: String, default: null })
  stripeSubscriptionId: string | null;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

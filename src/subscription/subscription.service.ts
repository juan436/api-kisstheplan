import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription } from './schemas/subscription.schema';

const TRIAL_DAYS = 7;
const ANNUAL_DAYS = 365;

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
  ) {}

  async create(weddingId: string, userId: string, plan: 'trial' | 'annual'): Promise<Subscription> {
    const now = new Date();

    const data =
      plan === 'trial'
        ? {
            plan,
            status: 'trial' as const,
            trialStartDate: now,
            trialEndDate: new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
            currentPeriodStart: null,
            currentPeriodEnd: null,
            amount: null,
          }
        : {
            plan,
            status: 'active' as const,
            trialStartDate: null,
            trialEndDate: null,
            currentPeriodStart: now,
            currentPeriodEnd: new Date(now.getTime() + ANNUAL_DAYS * 24 * 60 * 60 * 1000),
            amount: 70,
          };

    return this.subscriptionModel.create({
      weddingId: new Types.ObjectId(weddingId),
      userId: new Types.ObjectId(userId),
      currency: 'EUR',
      stripeSubscriptionId: null,
      cancelledAt: null,
      ...data,
    });
  }

  async findByWeddingId(weddingId: string): Promise<Subscription | null> {
    const sub = await this.subscriptionModel.findOne({ weddingId: new Types.ObjectId(weddingId) });
    if (sub && sub.status === 'trial' && sub.trialEndDate && sub.trialEndDate < new Date()) {
      sub.status = 'expired';
      await sub.save();
    }
    return sub;
  }

  async activate(weddingId: string, userId: string, stripeSessionId: string): Promise<void> {
    const now = new Date();
    await this.subscriptionModel.findOneAndUpdate(
      { weddingId: new Types.ObjectId(weddingId) },
      {
        $set: {
          plan: 'annual',
          status: 'active',
          stripeSubscriptionId: stripeSessionId,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          amount: 70,
          trialEndDate: null,
        },
      },
      { upsert: true },
    );
  }

  async findAllForAdmin(): Promise<Subscription[]> {
    return this.subscriptionModel.find().sort({ createdAt: -1 });
  }

  toResponse(sub: Subscription) {
    return {
      id: sub._id.toString(),
      weddingId: sub.weddingId.toString(),
      plan: sub.plan,
      status: sub.status,
      trialStartDate: sub.trialStartDate?.toISOString() ?? null,
      trialEndDate: sub.trialEndDate?.toISOString() ?? null,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      amount: sub.amount,
      currency: sub.currency,
    };
  }
}

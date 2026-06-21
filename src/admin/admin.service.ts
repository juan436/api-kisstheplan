import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Wedding } from '../wedding/schemas/wedding.schema';
import { Subscription } from '../subscription/schemas/subscription.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Wedding.name) private weddingModel: Model<Wedding>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
  ) {}

  async getStats() {
    const [totalUsers, totalWeddings, subCounts] = await Promise.all([
      this.userModel.countDocuments({ role: { $ne: 'admin' } }),
      this.weddingModel.countDocuments(),
      this.subscriptionModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    for (const entry of subCounts) byStatus[entry._id] = entry.count;

    return {
      totalUsers,
      totalWeddings,
      trial: byStatus['trial'] ?? 0,
      active: byStatus['active'] ?? 0,
      expired: byStatus['expired'] ?? 0,
      cancelled: byStatus['cancelled'] ?? 0,
    };
  }

  async getWeddings() {
    const [weddings, subscriptions] = await Promise.all([
      this.weddingModel.find().sort({ createdAt: -1 }).lean(),
      this.subscriptionModel.find().lean(),
    ]);

    const userIds = [...new Set(weddings.map((w) => w.userId.toString()))];
    const users = await this.userModel
      .find({ _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } })
      .select('name email')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const subMap = new Map(subscriptions.map((s) => [s.weddingId.toString(), s]));

    return weddings.map((w) => {
      const owner = userMap.get(w.userId.toString());
      const sub = subMap.get(w._id.toString());
      return {
        id: w._id.toString(),
        name: `${w.partner1Name} & ${w.partner2Name}`,
        date: w.date.toISOString().split('T')[0],
        ownerName: owner?.name ?? '—',
        ownerEmail: owner?.email ?? '—',
        plan: sub?.plan ?? null,
        status: sub?.status ?? null,
        trialEndDate: sub?.trialEndDate?.toISOString() ?? null,
        currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
        amount: sub?.amount ?? null,
      };
    });
  }
}

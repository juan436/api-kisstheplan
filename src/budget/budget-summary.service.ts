import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ExpenseCategory } from './schemas/expense-category.schema';
import { PaymentSchedule } from './schemas/payment-schedule.schema';

@Injectable()
export class BudgetSummaryService {
  constructor(
    @InjectModel(ExpenseCategory.name) private categoryModel: Model<ExpenseCategory>,
    @InjectModel(PaymentSchedule.name) private paymentScheduleModel: Model<PaymentSchedule>,
  ) {}

  async getSummary(weddingId: string) {
    const [categories, payments] = await Promise.all([
      this.categoryModel.find({ weddingId: new Types.ObjectId(weddingId) }).sort({ order: 1 }),
      this.paymentScheduleModel.find({ weddingId: new Types.ObjectId(weddingId) }),
    ]);

    let totalEstimated = 0;
    let totalReal = 0;
    let totalPaid = 0;

    for (const cat of categories) {
      for (const item of cat.items) {
        totalEstimated += item.estimated;
        totalReal += item.actual;
        const itemPayments = payments.filter((p) => p.itemId?.toString() === item._id.toString());
        totalPaid += itemPayments.length > 0
          ? itemPayments.filter((p) => !!p.paidAt).reduce((s, p) => s + p.amount, 0)
          : item.paid;
      }
    }

    return { totalEstimated, totalReal, totalPaid, totalPending: totalReal - totalPaid };
  }
}

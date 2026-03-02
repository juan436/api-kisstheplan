import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ExpenseCategory,
  ExpenseCategorySchema,
} from './schemas/expense-category.schema';
import {
  PaymentSchedule,
  PaymentScheduleSchema,
} from './schemas/payment-schedule.schema';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { WeddingModule } from '../wedding/wedding.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExpenseCategory.name, schema: ExpenseCategorySchema },
      { name: PaymentSchedule.name, schema: PaymentScheduleSchema },
    ]),
    WeddingModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}

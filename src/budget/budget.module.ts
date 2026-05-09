import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpenseCategory, ExpenseCategorySchema } from './schemas/expense-category.schema';
import { PaymentSchedule, PaymentScheduleSchema } from './schemas/payment-schedule.schema';
import { BudgetController } from './budget.controller';
import { BudgetCategoryService } from './budget-category.service';
import { BudgetPaymentService } from './budget-payment.service';
import { BudgetSummaryService } from './budget-summary.service';
import { WeddingModule } from '../wedding/wedding.module';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExpenseCategory.name, schema: ExpenseCategorySchema },
      { name: PaymentSchedule.name, schema: PaymentScheduleSchema },
    ]),
    WeddingModule,
    ExcelModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetCategoryService, BudgetPaymentService, BudgetSummaryService],
  exports: [BudgetCategoryService, BudgetPaymentService, BudgetSummaryService],
})
export class BudgetModule {}

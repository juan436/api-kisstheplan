import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from '../task/schemas/task.schema';
import {
  ExpenseCategory,
  ExpenseCategorySchema,
} from '../budget/schemas/expense-category.schema';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { WeddingModule } from '../wedding/wedding.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: ExpenseCategory.name, schema: ExpenseCategorySchema },
    ]),
    WeddingModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}

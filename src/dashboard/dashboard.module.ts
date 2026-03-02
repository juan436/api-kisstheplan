import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { WeddingModule } from '../wedding/wedding.module';
import { GuestModule } from '../guest/guest.module';
import { BudgetModule } from '../budget/budget.module';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [WeddingModule, GuestModule, BudgetModule, TaskModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

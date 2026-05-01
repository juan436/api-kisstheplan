import { Injectable } from '@nestjs/common';
import { WeddingService } from '../wedding/wedding.service';
import { GuestService } from '../guest/guest.service';
import { BudgetSummaryService } from '../budget/budget-summary.service';
import { BudgetPaymentService } from '../budget/budget-payment.service';
import { TaskService } from '../task/task.service';

@Injectable()
export class DashboardService {
  constructor(
    private weddingService: WeddingService,
    private guestService: GuestService,
    private budgetSummaryService: BudgetSummaryService,
    private budgetPaymentService: BudgetPaymentService,
    private taskService: TaskService,
  ) {}

  async getSummary(userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const weddingId = wedding._id.toString();

    const [guestStats, budgetSummary, upcomingTasks, upcomingPayments, taskProgress] =
      await Promise.all([
        this.guestService.getStats(weddingId),
        this.budgetSummaryService.getSummary(weddingId),
        this.taskService.getUpcoming(weddingId, 5),
        this.budgetPaymentService.getUpcomingPayments(weddingId, 3),
        this.taskService.getProgress(weddingId),
      ]);

    return {
      wedding: this.weddingService.toResponse(wedding),
      guestStats,
      budgetSummary,
      upcomingTasks: upcomingTasks.map((t) => this.taskService.toResponse(t)),
      upcomingPayments,
      taskProgress,
    };
  }
}

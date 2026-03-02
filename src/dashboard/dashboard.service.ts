import { Injectable } from '@nestjs/common';
import { WeddingService } from '../wedding/wedding.service';
import { GuestService } from '../guest/guest.service';
import { BudgetService } from '../budget/budget.service';
import { TaskService } from '../task/task.service';

@Injectable()
export class DashboardService {
  constructor(
    private weddingService: WeddingService,
    private guestService: GuestService,
    private budgetService: BudgetService,
    private taskService: TaskService,
  ) {}

  async getSummary(userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const weddingId = wedding._id.toString();

    const [guestStats, budgetSummary, upcomingTasks, upcomingPayments, taskProgress] =
      await Promise.all([
        this.guestService.getStats(weddingId),
        this.budgetService.getSummary(weddingId),
        this.taskService.getUpcoming(weddingId, 5),
        this.budgetService.getUpcomingPayments(weddingId, 3),
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

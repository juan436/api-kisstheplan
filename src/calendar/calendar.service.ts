import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from '../task/schemas/task.schema';
import { ExpenseCategory } from '../budget/schemas/expense-category.schema';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(ExpenseCategory.name)
    private categoryModel: Model<ExpenseCategory>,
  ) {}

  async generateIcal(
    weddingId: string,
    weddingName: string,
    weddingDate: Date,
  ): Promise<string> {
    const wid = new Types.ObjectId(weddingId);

    const [tasks, categories] = await Promise.all([
      this.taskModel.find({ weddingId: wid, dueDate: { $ne: null } }),
      this.categoryModel.find({ weddingId: wid }),
    ]);

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KissthePlan//Wedding Calendar//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${this.escapeText(weddingName)}`,
      'X-WR-TIMEZONE:Europe/Madrid',
    ];

    // Wedding day event
    lines.push(...this.buildEvent({
      uid: `wedding-${weddingId}@kisstheplan.es`,
      dtstart: this.formatDate(weddingDate),
      summary: `💍 ${weddingName}`,
      description: 'El gran día',
    }));

    // Task events
    for (const task of tasks) {
      if (!task.dueDate) continue;
      lines.push(...this.buildEvent({
        uid: `task-${task._id.toString()}@kisstheplan.es`,
        dtstart: this.formatDate(task.dueDate),
        summary: `✓ ${task.title}`,
        description: task.notes || task.category || '',
      }));
    }

    // Payment events from ExpenseItem.dueDate
    for (const cat of categories) {
      for (const item of cat.items as any[]) {
        if (!item.dueDate) continue;
        const amount = `${(item.actual || item.estimated || 0).toLocaleString('es-ES')} EUR`;
        lines.push(...this.buildEvent({
          uid: `item-${item._id.toString()}@kisstheplan.es`,
          dtstart: this.formatDate(new Date(item.dueDate)),
          summary: `💶 ${item.concept} — ${amount}`,
          description: cat.name,
        }));
      }
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private buildEvent(params: {
    uid: string;
    dtstart: string;
    summary: string;
    description?: string;
  }): string[] {
    const now = this.formatDateTime(new Date());
    return [
      'BEGIN:VEVENT',
      `UID:${params.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${params.dtstart}`,
      `DTEND;VALUE=DATE:${params.dtstart}`,
      `SUMMARY:${this.escapeText(params.summary)}`,
      ...(params.description
        ? [`DESCRIPTION:${this.escapeText(params.description)}`]
        : []),
      'END:VEVENT',
    ];
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  private formatDateTime(date: Date): string {
    return (
      date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '') + 'Z'
    );
  }

  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }
}

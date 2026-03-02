import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { defaultTaskTemplate } from './data/task-template';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  async findAll(
    weddingId: string,
    filters?: { status?: string; category?: string; stage?: string },
  ): Promise<Task[]> {
    const query: Record<string, unknown> = {
      weddingId: new Types.ObjectId(weddingId),
    };

    if (filters?.status) query.status = filters.status;
    if (filters?.category) query.category = filters.category;
    if (filters?.stage) query.stage = filters.stage;

    return this.taskModel.find(query).sort({ order: 1, dueDate: 1 });
  }

  async create(weddingId: string, dto: CreateTaskDto): Promise<Task> {
    return this.taskModel.create({
      weddingId: new Types.ObjectId(weddingId),
      title: dto.title,
      category: dto.category,
      stage: dto.stage,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: (dto.status as TaskStatus) || TaskStatus.PENDING,
      notes: dto.notes,
      isCustom: true,
    });
  }

  async update(
    taskId: string,
    weddingId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Tarea no encontrada');
    if (task.weddingId.toString() !== weddingId) {
      throw new ForbiddenException();
    }

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.stage !== undefined) updateData.stage = dto.stage;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'done') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const updated = await this.taskModel.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true },
    );
    return updated!;
  }

  async delete(taskId: string, weddingId: string): Promise<void> {
    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Tarea no encontrada');
    if (task.weddingId.toString() !== weddingId) {
      throw new ForbiddenException();
    }
    await this.taskModel.findByIdAndDelete(taskId);
  }

  async getUpcoming(weddingId: string, limit = 5): Promise<Task[]> {
    return this.taskModel
      .find({
        weddingId: new Types.ObjectId(weddingId),
        status: { $ne: TaskStatus.DONE },
        dueDate: { $ne: null },
      })
      .sort({ dueDate: 1 })
      .limit(limit);
  }

  async getProgress(weddingId: string) {
    const total = await this.taskModel.countDocuments({
      weddingId: new Types.ObjectId(weddingId),
    });
    const completed = await this.taskModel.countDocuments({
      weddingId: new Types.ObjectId(weddingId),
      status: TaskStatus.DONE,
    });
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  async seedTemplate(weddingId: string): Promise<void> {
    const tasks = defaultTaskTemplate.map((t) => ({
      weddingId: new Types.ObjectId(weddingId),
      title: t.title,
      category: t.category,
      stage: t.stage,
      order: t.order,
      status: TaskStatus.PENDING,
      isCustom: false,
    }));
    await this.taskModel.insertMany(tasks);
  }

  toResponse(task: Task) {
    return {
      id: task._id.toString(),
      title: task.title,
      status: task.status,
      dueDate: task.dueDate?.toISOString().split('T')[0],
      category: task.category,
    };
  }
}

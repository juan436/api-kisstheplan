import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeddingGuard } from '../wedding/guards/wedding.guard';
import { CurrentWeddingId } from '../common/decorators/current-wedding-id.decorator';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, WeddingGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  async findAll(
    @CurrentWeddingId() weddingId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('stage') stage?: string,
  ) {
    const tasks = await this.taskService.findAll(weddingId, { status, category, stage });
    return tasks.map((t) => this.taskService.toResponse(t));
  }

  @Post()
  async create(@CurrentWeddingId() weddingId: string, @Body() dto: CreateTaskDto) {
    const task = await this.taskService.create(weddingId, dto);
    return this.taskService.toResponse(task);
  }

  @Patch(':id')
  async update(@CurrentWeddingId() weddingId: string, @Param('id') taskId: string, @Body() dto: UpdateTaskDto) {
    const task = await this.taskService.update(taskId, weddingId, dto);
    return this.taskService.toResponse(task);
  }

  @Delete(':id')
  async delete(@CurrentWeddingId() weddingId: string, @Param('id') taskId: string) {
    await this.taskService.delete(taskId, weddingId);
    return { message: 'Tarea eliminada' };
  }

  @Get('categories')
  async getCategories(@CurrentWeddingId() weddingId: string) {
    return this.taskService.getCategories(weddingId);
  }

  @Get('upcoming')
  async getUpcoming(@CurrentWeddingId() weddingId: string) {
    const tasks = await this.taskService.getUpcoming(weddingId);
    return tasks.map((t) => this.taskService.toResponse(t));
  }

  @Get('progress')
  async getProgress(@CurrentWeddingId() weddingId: string) {
    return this.taskService.getProgress(weddingId);
  }
}

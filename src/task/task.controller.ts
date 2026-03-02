import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WeddingService } from '../wedding/wedding.service';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(
    private taskService: TaskService,
    private weddingService: WeddingService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('stage') stage?: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const tasks = await this.taskService.findAll(wedding._id.toString(), {
      status,
      category,
      stage,
    });
    return tasks.map((t) => this.taskService.toResponse(t));
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const task = await this.taskService.create(wedding._id.toString(), dto);
    return this.taskService.toResponse(task);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const task = await this.taskService.update(
      taskId,
      wedding._id.toString(),
      dto,
    );
    return this.taskService.toResponse(task);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') taskId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.taskService.delete(taskId, wedding._id.toString());
    return { message: 'Tarea eliminada' };
  }

  @Get('upcoming')
  async getUpcoming(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const tasks = await this.taskService.getUpcoming(wedding._id.toString());
    return tasks.map((t) => this.taskService.toResponse(t));
  }
}

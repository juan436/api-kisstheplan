import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WeddingService } from './wedding.service';
import { CreateWeddingDto } from './dto/create-wedding.dto';
import { UpdateWeddingDto } from './dto/update-wedding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TaskService } from '../task/task.service';
import { ExpenseCategory } from '../budget/schemas/expense-category.schema';

const DEFAULT_CATEGORY_NAMES = [
  'Finca / Lugar', 'Catering', 'Fotografía', 'Vídeo',
  'Música en Directo', 'DJ / Sistema de Sonido', 'Decoración',
  'Flores', 'Transporte', 'Vestido Novia', 'Traje Novio',
  'Papelería / Invitaciones', 'Regalos Invitados', 'Wedding Planner', 'Otros',
];

@ApiTags('Weddings')
@Controller('weddings')
export class WeddingController {
  constructor(
    private weddingService: WeddingService,
    @Inject(forwardRef(() => TaskService)) private taskService: TaskService,
    @InjectModel(ExpenseCategory.name) private categoryModel: Model<ExpenseCategory>,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateWeddingDto) {
    const wedding = await this.weddingService.create(userId, dto);
    const weddingId = wedding._id.toString();

    await Promise.all([
      this.taskService.seedTemplate(weddingId),
      this.categoryModel.insertMany(
        DEFAULT_CATEGORY_NAMES.map((name, i) => ({
          weddingId: new Types.ObjectId(weddingId),
          name,
          order: i,
          items: [],
        })),
      ),
    ]);

    return this.weddingService.toResponse(wedding);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyWedding(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.weddingService.toResponse(wedding);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateWeddingDto) {
    const wedding = await this.weddingService.update(id, userId, dto);
    return this.weddingService.toResponse(wedding);
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const wedding = await this.weddingService.findBySlug(slug);
    return this.weddingService.toResponse(wedding);
  }
}

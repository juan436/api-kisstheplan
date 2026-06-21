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
  NotFoundException,
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
import { SubscriptionService } from '../subscription/subscription.service';

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
    private subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateWeddingDto) {
    const { plan = 'trial', ...weddingData } = dto;
    const wedding = await this.weddingService.create(userId, weddingData as CreateWeddingDto);
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
      this.subscriptionService.create(weddingId, userId, plan),
    ]);

    return this.weddingService.toResponse(wedding);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMyWedding(
    @CurrentUser('weddingId') weddingId: string | null,
    @CurrentUser('id') userId: string,
  ) {
    const wedding = weddingId
      ? await this.weddingService.findById(weddingId)
      : await this.weddingService.findByUserId(userId);
    if (!wedding) throw new NotFoundException('Boda no encontrada');
    return this.weddingService.toResponse(wedding);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateWeddingDto) {
    const wedding = await this.weddingService.update(id, userId, dto);
    return this.weddingService.toResponse(wedding);
  }

  @Get('check-slug/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkSlug(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    return this.weddingService.checkSlug(slug, userId);
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const wedding = await this.weddingService.findBySlug(slug);
    return this.weddingService.toResponse(wedding);
  }
}

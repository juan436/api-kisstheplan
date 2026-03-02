import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WeddingService } from './wedding.service';
import { CreateWeddingDto } from './dto/create-wedding.dto';
import { UpdateWeddingDto } from './dto/update-wedding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Weddings')
@Controller('weddings')
export class WeddingController {
  constructor(private weddingService: WeddingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWeddingDto,
  ) {
    const wedding = await this.weddingService.create(userId, dto);
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
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWeddingDto,
  ) {
    const wedding = await this.weddingService.update(id, userId, dto);
    return this.weddingService.toResponse(wedding);
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const wedding = await this.weddingService.findBySlug(slug);
    return this.weddingService.toResponse(wedding);
  }
}

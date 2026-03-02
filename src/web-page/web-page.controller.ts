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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WebPageService } from './web-page.service';
import { WeddingService } from '../wedding/wedding.service';
import { CreateWebPageDto, UpdateWebPageDto, PublicRsvpDto } from './dto/create-web-page.dto';

@ApiTags('web-page')
@Controller()
export class WebPageController {
  constructor(
    private readonly webPageService: WebPageService,
    private readonly weddingService: WeddingService,
  ) {}

  private async getWeddingId(user: any): Promise<string> {
    const wedding = await this.weddingService.findByUserId(user.id);
    return wedding._id.toString();
  }

  // --- Authenticated endpoints ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('web-page')
  async getMyWebPage(@CurrentUser() user: any) {
    const weddingId = await this.getWeddingId(user);
    const page = await this.webPageService.findByWeddingId(weddingId);
    return page ? this.webPageService.toResponse(page) : null;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('web-page')
  async createWebPage(@CurrentUser() user: any, @Body() dto: CreateWebPageDto) {
    const weddingId = await this.getWeddingId(user);
    const page = await this.webPageService.create(weddingId, dto);
    return this.webPageService.toResponse(page);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('web-page')
  async updateWebPage(@CurrentUser() user: any, @Body() dto: UpdateWebPageDto) {
    const weddingId = await this.getWeddingId(user);
    const page = await this.webPageService.update(weddingId, dto);
    return this.webPageService.toResponse(page);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('web-page/publish')
  async publish(@CurrentUser() user: any) {
    const weddingId = await this.getWeddingId(user);
    const page = await this.webPageService.publish(weddingId);
    return this.webPageService.toResponse(page);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('web-page/unpublish')
  async unpublish(@CurrentUser() user: any) {
    const weddingId = await this.getWeddingId(user);
    const page = await this.webPageService.unpublish(weddingId);
    return this.webPageService.toResponse(page);
  }

  // --- Public endpoints (no auth) ---

  @Get('public/wedding/:slug')
  async getPublicWedding(@Param('slug') slug: string) {
    return this.webPageService.getPublicPage(slug);
  }

  @Post('public/rsvp/:slug')
  async submitRsvp(@Param('slug') slug: string, @Body() dto: PublicRsvpDto) {
    return this.webPageService.submitRsvp(slug, dto);
  }
}

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
import { WeddingGuard } from '../wedding/guards/wedding.guard';
import { CurrentWeddingId } from '../common/decorators/current-wedding-id.decorator';
import { WebPageService } from './web-page.service';
import { CreateWebPageDto, UpdateWebPageDto, PublicRsvpDto, RsvpLookupDto, GroupRsvpDto, RsvpEmailLookupDto } from './dto/create-web-page.dto';

@ApiTags('web-page')
@Controller()
export class WebPageController {
  constructor(private readonly webPageService: WebPageService) {}

  // --- Authenticated endpoints ---

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WeddingGuard)
  @Get('web-page')
  async getMyWebPage(@CurrentWeddingId() weddingId: string) {
    const page = await this.webPageService.findByWeddingId(weddingId);
    return page ? this.webPageService.toResponse(page) : null;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WeddingGuard)
  @Post('web-page')
  async createWebPage(@CurrentWeddingId() weddingId: string, @Body() dto: CreateWebPageDto) {
    const page = await this.webPageService.create(weddingId, dto);
    return this.webPageService.toResponse(page);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WeddingGuard)
  @Patch('web-page')
  async updateWebPage(@CurrentWeddingId() weddingId: string, @Body() dto: UpdateWebPageDto) {
    const page = await this.webPageService.update(weddingId, dto);
    return this.webPageService.toResponse(page);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WeddingGuard)
  @Post('web-page/publish')
  async publish(@CurrentWeddingId() weddingId: string) {
    const page = await this.webPageService.publish(weddingId);
    return this.webPageService.toResponse(page);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WeddingGuard)
  @Post('web-page/unpublish')
  async unpublish(@CurrentWeddingId() weddingId: string) {
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

  @Get('public/rsvp/token/:token')
  async getGuestByToken(@Param('token') token: string) {
    return this.webPageService.findGuestByToken(token);
  }

  @Post('public/rsvp/:slug/lookup')
  async lookupGuest(@Param('slug') slug: string, @Body() dto: RsvpLookupDto) {
    return this.webPageService.lookupGuest(slug, dto);
  }

  @Post('public/rsvp/:slug/google')
  async lookupByEmail(@Param('slug') slug: string, @Body() dto: RsvpEmailLookupDto) {
    return this.webPageService.lookupByEmail(slug, dto.email);
  }

  @Post('public/rsvp/:slug/group')
  async submitGroupRsvp(@Param('slug') slug: string, @Body() dto: GroupRsvpDto) {
    return this.webPageService.submitGroupRsvp(slug, dto);
  }
}

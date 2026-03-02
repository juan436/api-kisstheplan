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
import { GuestService } from './guest.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WeddingService } from '../wedding/wedding.service';

@ApiTags('Guests')
@Controller('guests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GuestController {
  constructor(
    private guestService: GuestService,
    private weddingService: WeddingService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('rsvp') rsvp?: string,
    @Query('search') search?: string,
    @Query('list') list?: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const guests = await this.guestService.findAll(wedding._id.toString(), {
      rsvp,
      search,
      list,
    });
    return guests.map((g) => this.guestService.toResponse(g));
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGuestDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const guest = await this.guestService.create(
      wedding._id.toString(),
      dto,
    );
    return this.guestService.toResponse(guest);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') guestId: string,
    @Body() dto: UpdateGuestDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const guest = await this.guestService.update(
      guestId,
      wedding._id.toString(),
      dto,
    );
    return this.guestService.toResponse(guest);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id') guestId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.guestService.delete(guestId, wedding._id.toString());
    return { message: 'Invitado eliminado' };
  }

  @Get('stats')
  async getStats(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    return this.guestService.getStats(wedding._id.toString());
  }

  // --- Guest Groups ---

  @Get('groups')
  async findAllGroups(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const groups = await this.guestService.findAllGroups(
      wedding._id.toString(),
    );
    return groups.map((g) => this.guestService.groupToResponse(g));
  }

  @Post('groups')
  async createGroup(
    @CurrentUser('id') userId: string,
    @Body('name') name: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const group = await this.guestService.createGroup(
      wedding._id.toString(),
      name,
    );
    return this.guestService.groupToResponse(group);
  }

  @Patch('groups/:id')
  async updateGroup(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body('name') name: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const group = await this.guestService.updateGroup(
      groupId,
      wedding._id.toString(),
      name,
    );
    return this.guestService.groupToResponse(group);
  }

  @Delete('groups/:id')
  async deleteGroup(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.guestService.deleteGroup(groupId, wedding._id.toString());
    return { message: 'Grupo eliminado' };
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GuestService } from './guest.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeddingGuard } from '../wedding/guards/wedding.guard';
import { CurrentWeddingId } from '../common/decorators/current-wedding-id.decorator';

@ApiTags('Guests')
@Controller('guests')
@UseGuards(JwtAuthGuard, WeddingGuard)
@ApiBearerAuth()
export class GuestController {
  constructor(private guestService: GuestService) {}

  @Get()
  async findAll(
    @CurrentWeddingId() weddingId: string,
    @Query('rsvp') rsvp?: string,
    @Query('search') search?: string,
    @Query('list') list?: string,
  ) {
    const guests = await this.guestService.findAll(weddingId, { rsvp, search, list });
    return guests.map((g) => this.guestService.toResponse(g));
  }

  @Post()
  async create(@CurrentWeddingId() weddingId: string, @Body() dto: CreateGuestDto) {
    const guest = await this.guestService.create(weddingId, dto);
    return this.guestService.toResponse(guest);
  }

  @Patch(':id')
  async update(@CurrentWeddingId() weddingId: string, @Param('id') guestId: string, @Body() dto: UpdateGuestDto) {
    const guest = await this.guestService.update(guestId, weddingId, dto);
    return this.guestService.toResponse(guest);
  }

  @Delete(':id')
  async delete(@CurrentWeddingId() weddingId: string, @Param('id') guestId: string) {
    await this.guestService.delete(guestId, weddingId);
    return { message: 'Invitado eliminado' };
  }

  @Get('stats')
  async getStats(@CurrentWeddingId() weddingId: string) {
    return this.guestService.getStats(weddingId);
  }

  @Post('invite-bulk')
  @HttpCode(200)
  async sendBulkInvites(
    @CurrentWeddingId() weddingId: string,
    @Body('guestIds') guestIds: string[],
  ) {
    return this.guestService.sendBulkInvitations(guestIds, weddingId);
  }

  @Post(':id/invite')
  @HttpCode(200)
  async sendInvite(
    @CurrentWeddingId() weddingId: string,
    @Param('id') guestId: string,
  ) {
    return this.guestService.sendInvitation(guestId, weddingId);
  }

  @Get(':id/history')
  async getHistory(@CurrentWeddingId() weddingId: string, @Param('id') guestId: string) {
    return this.guestService.getHistory(guestId, weddingId);
  }

  @Get('groups')
  async findAllGroups(@CurrentWeddingId() weddingId: string) {
    const groups = await this.guestService.findAllGroups(weddingId);
    return groups.map((g) => this.guestService.groupToResponse(g));
  }

  @Post('groups')
  async createGroup(@CurrentWeddingId() weddingId: string, @Body('name') name: string) {
    const group = await this.guestService.createGroup(weddingId, name);
    return this.guestService.groupToResponse(group);
  }

  @Patch('groups/:id')
  async updateGroup(@CurrentWeddingId() weddingId: string, @Param('id') groupId: string, @Body('name') name: string) {
    const group = await this.guestService.updateGroup(groupId, weddingId, name);
    return this.guestService.groupToResponse(group);
  }

  @Delete('groups/:id')
  async deleteGroup(@CurrentWeddingId() weddingId: string, @Param('id') groupId: string) {
    await this.guestService.deleteGroup(groupId, weddingId);
    return { message: 'Grupo eliminado' };
  }
}

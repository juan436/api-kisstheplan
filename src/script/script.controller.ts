import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ScriptService } from './script.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { CreateAreaDto } from './dto/create-area.dto';
import { ReorderDto } from './dto/reorder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WeddingService } from '../wedding/wedding.service';

@ApiTags('Script')
@Controller('script')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScriptController {
  constructor(
    private scriptService: ScriptService,
    private weddingService: WeddingService,
  ) {}

  // --- Entries ---

  @Get('entries')
  async getEntries(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const entries = await this.scriptService.findEntries(wedding._id.toString());
    return entries.map((e) => this.scriptService.entryToResponse(e));
  }

  @Post('entries')
  async createEntry(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateEntryDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const entry = await this.scriptService.createEntry(wedding._id.toString(), dto);
    return this.scriptService.entryToResponse(entry);
  }

  @Patch('entries/reorder')
  async reorderEntries(
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const entries = await this.scriptService.reorderEntries(wedding._id.toString(), dto.ids);
    return entries.map((e) => this.scriptService.entryToResponse(e));
  }

  @Patch('entries/:id')
  async updateEntry(
    @CurrentUser('id') userId: string,
    @Param('id') entryId: string,
    @Body() dto: UpdateEntryDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const entry = await this.scriptService.updateEntry(entryId, wedding._id.toString(), dto);
    return this.scriptService.entryToResponse(entry);
  }

  @Delete('entries/:id')
  async deleteEntry(
    @CurrentUser('id') userId: string,
    @Param('id') entryId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.scriptService.deleteEntry(entryId, wedding._id.toString());
    return { message: 'Entrada eliminada' };
  }

  // --- Areas ---

  @Get('areas')
  async getAreas(@CurrentUser('id') userId: string) {
    const wedding = await this.weddingService.findByUserId(userId);
    const areas = await this.scriptService.findAreas(wedding._id.toString());
    return areas.map((a) => this.scriptService.areaToResponse(a));
  }

  @Post('areas')
  async createArea(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAreaDto,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const area = await this.scriptService.createArea(wedding._id.toString(), dto);
    return this.scriptService.areaToResponse(area);
  }

  @Patch('areas/:id')
  async updateArea(
    @CurrentUser('id') userId: string,
    @Param('id') areaId: string,
    @Body() dto: Partial<CreateAreaDto>,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    const area = await this.scriptService.updateArea(areaId, wedding._id.toString(), dto);
    return this.scriptService.areaToResponse(area);
  }

  @Delete('areas/:id')
  async deleteArea(
    @CurrentUser('id') userId: string,
    @Param('id') areaId: string,
  ) {
    const wedding = await this.weddingService.findByUserId(userId);
    await this.scriptService.deleteArea(areaId, wedding._id.toString());
    return { message: 'Área eliminada' };
  }
}

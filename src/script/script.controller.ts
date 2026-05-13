import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ScriptService } from './script.service';
import { ExcelService } from '../excel/excel.service';
import { WeddingService } from '../wedding/wedding.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { CreateAreaDto } from './dto/create-area.dto';
import { ReorderDto } from './dto/reorder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeddingGuard } from '../wedding/guards/wedding.guard';
import { CurrentWeddingId } from '../common/decorators/current-wedding-id.decorator';

@ApiTags('Script')
@Controller('script')
@UseGuards(JwtAuthGuard, WeddingGuard)
@ApiBearerAuth()
export class ScriptController {
  constructor(
    private scriptService: ScriptService,
    private excelService: ExcelService,
    private weddingService: WeddingService,
  ) {}

  // --- Entries ---

  @Get('entries')
  async getEntries(@CurrentWeddingId() weddingId: string) {
    const entries = await this.scriptService.findEntries(weddingId);
    return entries.map((e) => this.scriptService.entryToResponse(e));
  }

  @Post('entries')
  async createEntry(
    @CurrentWeddingId() weddingId: string,
    @Body() dto: CreateEntryDto,
  ) {
    const entry = await this.scriptService.createEntry(weddingId, dto);
    return this.scriptService.entryToResponse(entry);
  }

  @Patch('entries/reorder')
  async reorderEntries(
    @CurrentWeddingId() weddingId: string,
    @Body() dto: ReorderDto,
  ) {
    const entries = await this.scriptService.reorderEntries(weddingId, dto.ids);
    return entries.map((e) => this.scriptService.entryToResponse(e));
  }

  @Patch('entries/:id')
  async updateEntry(
    @CurrentWeddingId() weddingId: string,
    @Param('id') entryId: string,
    @Body() dto: UpdateEntryDto,
  ) {
    const entry = await this.scriptService.updateEntry(entryId, weddingId, dto);
    return this.scriptService.entryToResponse(entry);
  }

  @Delete('entries/:id')
  async deleteEntry(
    @CurrentWeddingId() weddingId: string,
    @Param('id') entryId: string,
  ) {
    await this.scriptService.deleteEntry(entryId, weddingId);
    return { message: 'Entrada eliminada' };
  }

  // --- Export PDF ---

  @Get('export/pdf')
  async exportPdf(@CurrentWeddingId() weddingId: string, @Res() res: Response) {
    const entries = await this.scriptService.findEntries(weddingId);
    const wedding = await this.weddingService.findById(weddingId);
    const weddingName = wedding ? `${wedding.partner1Name} & ${wedding.partner2Name}` : 'Mi Boda';
    const mapped = entries.map((e) => ({
      timeStart: (e as any).timeStart ?? undefined,
      timeEnd:   (e as any).timeEnd   ?? undefined,
      title:       e.title,
      description: (e as any).description ?? undefined,
    }));
    const buffer = await this.excelService.generateScriptPdf(mapped, weddingName);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="guion-boda.pdf"' });
    res.send(buffer);
  }

  // --- Areas ---

  @Get('areas')
  async getAreas(@CurrentWeddingId() weddingId: string) {
    const areas = await this.scriptService.findAreas(weddingId);
    return areas.map((a) => this.scriptService.areaToResponse(a));
  }

  @Post('areas')
  async createArea(
    @CurrentWeddingId() weddingId: string,
    @Body() dto: CreateAreaDto,
  ) {
    const area = await this.scriptService.createArea(weddingId, dto);
    return this.scriptService.areaToResponse(area);
  }

  @Patch('areas/:id')
  async updateArea(
    @CurrentWeddingId() weddingId: string,
    @Param('id') areaId: string,
    @Body() dto: Partial<CreateAreaDto>,
  ) {
    const area = await this.scriptService.updateArea(areaId, weddingId, dto);
    return this.scriptService.areaToResponse(area);
  }

  @Delete('areas/:id')
  async deleteArea(
    @CurrentWeddingId() weddingId: string,
    @Param('id') areaId: string,
  ) {
    await this.scriptService.deleteArea(areaId, weddingId);
    return { message: 'Área eliminada' };
  }
}

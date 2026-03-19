import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { WeddingService } from '../wedding/wedding.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly weddingService: WeddingService,
  ) {}

  @Get('ical/:slug')
  @ApiOperation({ summary: 'Feed iCal público de la boda' })
  async getIcal(@Param('slug') slug: string, @Res() res: Response) {
    let wedding;
    try {
      wedding = await this.weddingService.findBySlug(slug);
    } catch {
      throw new NotFoundException('Boda no encontrada');
    }

    const weddingName = `${wedding.partner1Name} & ${wedding.partner2Name}`;
    const ical = await this.calendarService.generateIcal(
      wedding._id.toString(),
      weddingName,
      wedding.date,
    );

    const filename = `${slug}.ics`;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(ical);
  }
}

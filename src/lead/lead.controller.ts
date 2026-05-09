import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { LeadService } from './lead.service';

class SubscribeDto {
  @IsEmail({}, { message: 'Email no válido' })
  email: string;
}

@ApiTags('leads')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post('subscribe')
  async subscribe(@Body() dto: SubscribeDto) {
    await this.leadService.subscribe(dto.email);
    return { success: true };
  }
}

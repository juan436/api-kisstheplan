import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignSeatDto {
  @ApiPropertyOptional({ description: 'Guest ID to assign, or null/undefined to unassign' })
  @IsOptional()
  @IsString()
  guestId?: string;
}

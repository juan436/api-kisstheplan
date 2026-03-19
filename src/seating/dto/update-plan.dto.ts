import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Aperitivo' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}

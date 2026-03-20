import { IsString, IsOptional, MinLength, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Aperitivo' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 'http://localhost:3001/uploads/photos/venue-1234.jpg' })
  @IsOptional()
  @IsString()
  backgroundImageUrl?: string;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  scaleFactor?: number;
}

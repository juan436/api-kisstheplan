import { IsString, IsOptional, MinLength, IsNumber, IsArray } from 'class-validator';
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

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  decorations?: Array<{
    id: string;
    type: string;
    posX: number;
    posY: number;
    label?: string;
    physicalWidth?: number;
    physicalHeight?: number;
  }>;
}

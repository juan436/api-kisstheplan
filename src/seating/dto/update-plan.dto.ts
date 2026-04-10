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
    customEmoji?: string;
  }>;

  @ApiPropertyOptional({ type: [Object], description: 'Zonas de calibración de escala local (4 puntos + dimensiones físicas)' })
  @IsOptional()
  @IsArray()
  zones?: Array<{
    id: string;
    points: { x: number; y: number }[];
    physicalWidth: number;
    physicalHeight: number;
    localScale: number;
  }>;

  @ApiPropertyOptional({ type: [Object], description: 'Biblioteca de emojis personalizados del plan' })
  @IsOptional()
  @IsArray()
  customEmojis?: Array<{
    id: string;
    emoji: string;
    label: string;
    physicalWidth: number;
    physicalHeight: number;
  }>;
}

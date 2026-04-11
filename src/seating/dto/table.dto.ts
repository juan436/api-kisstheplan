import { IsString, IsEnum, IsNumber, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SeatAssignmentDto {
  @ApiProperty()
  @IsNumber()
  seatNumber: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestId?: string;
}

export class CreateTableDto {
  @ApiProperty({ example: 'Mesa 1' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['round', 'rect', 'serpentine'], example: 'round' })
  @IsEnum(['round', 'rect', 'serpentine'])
  shape: 'round' | 'rect' | 'serpentine';

  @ApiProperty({ example: 8 })
  @IsNumber()
  @Min(1)
  @Max(50)
  capacity: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  posX: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  posY: number;
}

export class UpdateTableDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['round', 'rect', 'serpentine'] })
  @IsOptional()
  @IsEnum(['round', 'rect', 'serpentine'])
  shape?: 'round' | 'rect' | 'serpentine';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  posX?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  posY?: number;

  @ApiPropertyOptional({ description: 'Rotación en grados (0 | 90 | 180 | 270)' })
  @IsOptional()
  @IsNumber()
  rotation?: number;

  @ApiPropertyOptional({ description: 'Diámetro físico en metros (mesas redondas)' })
  @IsOptional()
  @IsNumber()
  physicalDiameter?: number;

  @ApiPropertyOptional({ description: 'Ancho físico en metros (mesas rectangulares)' })
  @IsOptional()
  @IsNumber()
  physicalWidth?: number;

  @ApiPropertyOptional({ description: 'Alto físico en metros (mesas rectangulares)' })
  @IsOptional()
  @IsNumber()
  physicalHeight?: number;

  @ApiPropertyOptional({ type: [SeatAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatAssignmentDto)
  assignments?: SeatAssignmentDto[];
}

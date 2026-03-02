import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty({ example: 'Alquiler finca' })
  @IsString()
  concept: string;

  @ApiProperty({ example: 8000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated?: number;

  @ApiProperty({ example: 8500, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actual?: number;

  @ApiProperty({ example: 4000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paid?: number;
}

import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWeddingDto {
  @ApiProperty({ example: 'Lucía' })
  @IsString()
  partner1Name: string;

  @ApiProperty({ example: 'García', required: false })
  @IsOptional()
  @IsString()
  partner1Last?: string;

  @ApiProperty({ example: 'Pablo' })
  @IsString()
  partner2Name: string;

  @ApiProperty({ example: 'Martínez', required: false })
  @IsOptional()
  @IsString()
  partner2Last?: string;

  @ApiProperty({ example: '2026-09-12' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Finca Tagamanent' })
  @IsString()
  venue: string;

  @ApiProperty({ example: 'Barcelona', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 300 })
  @IsNumber()
  @Min(0)
  estimatedGuests: number;

  @ApiProperty({ example: 60000 })
  @IsNumber()
  @Min(0)
  estimatedBudget: number;
}

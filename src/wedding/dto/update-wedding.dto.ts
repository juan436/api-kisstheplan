import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWeddingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  partner1Name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  partner1Last?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  partner2Name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  partner2Last?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedGuests?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedBudget?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mealOptions?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  transportOptions?: string[];
}

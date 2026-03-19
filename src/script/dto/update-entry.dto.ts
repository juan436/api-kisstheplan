import { IsString, IsOptional, IsEnum, IsNumber, IsObject } from 'class-validator';

export class UpdateEntryDto {
  @IsEnum(['exact', 'range', 'none'])
  @IsOptional()
  timeType?: 'exact' | 'range' | 'none';

  @IsString()
  @IsOptional()
  timeStart?: string;

  @IsString()
  @IsOptional()
  timeEnd?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  style?: { bold?: boolean; color?: string; fontSize?: string };

  @IsNumber()
  @IsOptional()
  order?: number;
}

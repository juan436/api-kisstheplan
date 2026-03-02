import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  concept?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

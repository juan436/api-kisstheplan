import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ example: 'Finca Tagamanent' })
  @IsString()
  vendorName: string;

  @ApiProperty({ example: '2º pago finca' })
  @IsString()
  concept: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vendorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

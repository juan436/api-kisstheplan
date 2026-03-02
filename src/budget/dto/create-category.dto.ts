import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Catering' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  order?: number;
}

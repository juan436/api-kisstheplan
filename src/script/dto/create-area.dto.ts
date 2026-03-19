import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateAreaDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

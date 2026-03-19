import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Cena' })
  @IsString()
  @MinLength(1)
  name: string;
}

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGuestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({ required: false, enum: ['confirmed', 'pending', 'rejected'] })
  @IsOptional()
  @IsEnum(['confirmed', 'pending', 'rejected'])
  rsvpStatus?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mealChoice?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  transport?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transportPickupPoint?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  plusOne?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  listName?: string;

  @ApiProperty({ required: false, enum: ['groom', 'bride', 'family_groom', 'family_bride', 'child', 'baby'] })
  @IsOptional()
  @IsEnum(['groom', 'bride', 'family_groom', 'family_bride', 'child', 'baby'])
  role?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

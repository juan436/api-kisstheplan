import { IsString, IsArray, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateVendorDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) categories?: string[];
  @IsOptional() @IsEnum(['confirmed', 'considering']) status?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() web?: string;
  @IsOptional() @IsString() social?: string;
  @IsOptional() @IsString() contractUrl?: string;
  @IsOptional() @IsBoolean() needsStaffMenu?: boolean;
  @IsOptional() @IsNumber() staffCount?: number;
  @IsOptional() @IsString() staffAllergies?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() totalAmount?: number;
}

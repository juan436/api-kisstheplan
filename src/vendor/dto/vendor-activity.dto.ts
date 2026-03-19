import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateVendorActivityDto {
  @IsEnum(['note', 'file'])
  type: string;

  @IsString()
  content: string;

  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() fileName?: string;
}

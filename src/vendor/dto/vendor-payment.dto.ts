import { IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateVendorPaymentDto {
  @IsNumber()
  amount: number;

  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateVendorPaymentDto {
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsBoolean() paid?: boolean;
  @IsOptional() @IsString() notes?: string;
}

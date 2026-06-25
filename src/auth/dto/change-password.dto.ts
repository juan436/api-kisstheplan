import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'password123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newpassword456' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

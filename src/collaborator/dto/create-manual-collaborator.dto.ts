import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateManualCollaboratorDto {
  @IsEmail({}, { message: 'Email no válido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'El nombre es obligatorio' })
  name: string;
}

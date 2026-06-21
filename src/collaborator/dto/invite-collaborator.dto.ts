import { IsEmail } from 'class-validator';

export class InviteCollaboratorDto {
  @IsEmail({}, { message: 'Email no válido' })
  email: string;
}

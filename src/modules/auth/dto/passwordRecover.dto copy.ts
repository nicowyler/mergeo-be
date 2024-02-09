import { IsEmail, IsNotEmpty } from 'class-validator';

export class PasswordRecoverDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

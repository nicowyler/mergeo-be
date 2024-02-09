import { IsJWT, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class NewPasswordDto {
  // @IsJWT()
  // token: string;

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;
}

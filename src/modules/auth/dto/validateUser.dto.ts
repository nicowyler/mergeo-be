import { ErrorMessages } from '@/common/enum';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ValidateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: ErrorMessages.ACTIVATION_CODE_LENGTH })
  activationCode: string;
}

import { ACCOUNT_TYPE } from '@/common/enum';
import {
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsMobilePhone('es-AR')
  phoneNumber: string;

  @IsNotEmpty()
  @IsEnum(ACCOUNT_TYPE)
  accountType: string;
}

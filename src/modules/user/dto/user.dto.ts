import { ACCOUNT_TYPE } from '../../../common/enum';
import { Exclude } from 'class-transformer';

import {
  IsArray,
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UUIDDto {
  @IsUUID('4')
  id: string;
}
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

export class UserResponseDto extends CreateUserDto {
  @IsUUID('4')
  id: string;

  @Exclude()
  password: string;

  @Exclude()
  email_verified: string;

  @Exclude()
  activationCode: string;

  @IsArray()
  roles: string[];
}

export class UpdateUserDto {
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsMobilePhone('es-AR')
  phoneNumber?: string;

  @Exclude()
  activationCode: string;
}

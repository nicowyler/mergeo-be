import { ACCOUNT_TYPE, ErrorMessages } from '../../../common/enum';
import { Exclude } from 'class-transformer';

import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BaseDateResponseDTO } from 'src/common/dto/baseDate.dto';
import { Role } from 'src/modules/role/role.entity';

export class UUIDDto {
  @IsUUID('4')
  id: string;
}

export class CreateUserDto extends BaseDateResponseDTO {
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
  @IsMobilePhone('es-AR', { strictMode: false })
  phoneNumber: string;

  @IsNotEmpty()
  @IsEnum(ACCOUNT_TYPE)
  accountType: string;
}

export class GetUsersDto {
  @IsUUID('4')
  id: string;
}

export class UserResponseDto extends CreateUserDto {
  @IsUUID('4')
  id: string;

  @Exclude()
  password: string;

  @Exclude()
  activationCode: string;

  @IsString()
  name: string;

  @IsBoolean()
  isActive: boolean;

  @IsArray()
  roles: Role[];
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

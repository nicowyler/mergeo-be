import { ApiProperty } from '@nestjs/swagger';
import { ACCOUNT_TYPE } from '../../../common/enum';
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
  @ApiProperty()
  @IsUUID('4')
  id: string;
}

export class CreateUserDto extends BaseDateResponseDTO {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMobilePhone('es-AR', { strictMode: false })
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(ACCOUNT_TYPE)
  accountType: string;
}

export class GetUsersDto {
  @ApiProperty()
  @IsUUID('4')
  id: string;
}

export class UserResponseDto extends CreateUserDto {
  @ApiProperty()
  @IsUUID('4')
  id: string;

  @ApiProperty()
  @Exclude()
  password: string;

  @ApiProperty()
  @Exclude()
  activationCode: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsArray()
  roles: Role[];
}

export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  @IsMobilePhone('es-AR')
  phoneNumber?: string;

  @ApiProperty()
  @Exclude()
  activationCode: string;
}

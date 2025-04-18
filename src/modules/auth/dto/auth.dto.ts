import { CreateUserDto } from 'src/modules/user/dto';
import { ACCOUNT_TYPE, ErrorMessages } from '../../../common/enum';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { CreateCompanyDto } from 'src/modules/company/dto';
import { ApiProperty } from '@nestjs/swagger';
import { Roles } from 'src/modules/role/role.entity';
import { UUID } from 'crypto';

export class UserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID('4')
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(ACCOUNT_TYPE, {
    message: `${ErrorMessages.ACCOUNT_TYPE} ${ACCOUNT_TYPE.CLIENT} o ${ACCOUNT_TYPE.PROVIDER}`,
  })
  accountType?: string[];
}

class TokensDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expiresIn: number;
}

export class AuthDto {
  user: UserDto;
  company: CreateCompanyDto;
  tokens: TokensDto;
}

export class RefreshTokenResponseDto {
  tokens: TokensDto;
}

export class RequestUserDto {
  user: UserDto;
}

export class RegisterUserDto extends CreateUserDto {
  @IsUUID('4', { message: ErrorMessages.IS_UUID })
  companyId: UUID;
}

export class RegisterCompanyDto extends CreateCompanyDto {}

export class AddUserDto {
  @IsUUID('4', { message: ErrorMessages.IS_UUID })
  companyId: UUID;

  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsArray()
  roles: Roles[];
}

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class NewPasswordDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class PasswordRecoverDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ValidateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: ErrorMessages.ACTIVATION_CODE_LENGTH })
  activationCode: string;
}

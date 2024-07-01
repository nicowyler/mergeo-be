import { CreateUserDto } from 'src/modules/user/dto';
import { ACCOUNT_TYPE, ErrorMessages } from '../../../common/enum';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { CreateCompanyDto } from 'src/modules/company/dto';
import { Exclude } from 'class-transformer';

export class UserDto {
  @IsNotEmpty()
  @IsUUID('4')
  id: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEnum(ACCOUNT_TYPE, {
    message: `${ErrorMessages.ACCOUNT_TYPE} ${ACCOUNT_TYPE.CLIENT} o ${ACCOUNT_TYPE.PROVIDER}`,
  })
  accountType?: string[];
}

class TokensDto {
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @IsString()
  @IsNotEmpty()
  expiresIn: number;
}

export class AuthDto {
  user: UserDto;

  tokens: TokensDto;
}

export class RefreshTokenResponseDto {
  tokens: TokensDto;
}

export class RefreshTokenDto {
  user: UserDto;
}

export class RegisterUserDto extends CreateUserDto {
  @IsUUID('4', { message: ErrorMessages.IS_UUID })
  companyId: string;
}

export class RegisterCompanyDto extends CreateCompanyDto {}

export class AddUserDto {
  @IsUUID('4', { message: ErrorMessages.IS_UUID })
  companyId: string;

  @IsEmail()
  email: string;
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

  @IsNotEmpty()
  @IsEmail()
  email: string;

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

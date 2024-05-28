import { ACCOUNT_TYPE } from '../../../common/enum';
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

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
  @IsEnum(ACCOUNT_TYPE)
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

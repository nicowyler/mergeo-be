import { Role } from '@/common/enum';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UserDto {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEnum(Role)
  roles?: string[];
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

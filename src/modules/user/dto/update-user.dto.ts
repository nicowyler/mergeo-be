import { IsMobilePhone, IsOptional, IsString } from 'class-validator';
import { Exclude } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
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

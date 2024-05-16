import { CreateCompanyDto } from '@/modules/company/dto';
import { CreateUserDto } from '@/modules/user/dto';
import { IsNumber, IsString } from 'class-validator';

export class RegisterUserDto extends CreateUserDto {
  @IsString()
  companyId: string;
}

export class RegisterCompanyDto extends CreateCompanyDto {}

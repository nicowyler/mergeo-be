import { CreateCompanyDto } from '../../../modules/company/dto';
import { CreateUserDto } from '../../../modules/user/dto';
import { IsUUID } from 'class-validator';

export class RegisterUserDto extends CreateUserDto {
  @IsUUID('4')
  companyId: string;
}

export class RegisterCompanyDto extends CreateCompanyDto {}

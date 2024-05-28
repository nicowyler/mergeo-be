import { Company } from '../../../modules/company/company.entity';
import { Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsMobilePhone('es-AR')
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsNotEmpty()
  @IsString()
  locality: string;

  @IsNotEmpty()
  @IsNumber()
  zipCode: number;
}

export class CompanyDtoResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class CreateBranchResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  phoneNumber: string;

  @Expose()
  address: string;

  @Expose()
  province: string;

  @Expose()
  locality: string;

  @Expose()
  zipCode: number;

  @Expose()
  @Type(() => CompanyDtoResponse)
  company: CompanyDtoResponse;
}

export class UpdateBranchDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsMobilePhone('es-AR')
  @IsOptional()
  phoneNumber?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  address?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  province?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  locality?: string;

  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  zipCode?: number;
}

export class BranchesResponseDto {
  company: {
    id: string;
    name: string;
    branches: {
      name: string;
      id: string;
    }[];
  };
}

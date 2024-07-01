import {
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsString()
  razonSocial: string;

  @IsNotEmpty()
  @IsString()
  cuit: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsNotEmpty()
  @IsString()
  locality: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  @IsString()
  activity: string;
}

export class GetCompanyDto {
  @IsUUID('4')
  id: string;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  razonSocial?: string;

  @IsOptional()
  @IsNumber()
  cuit?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  locality?: string;

  @IsOptional()
  @IsMobilePhone('es-AR')
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  activity?: string;
}

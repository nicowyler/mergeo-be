import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Address } from 'src/modules/company/address.entity';

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
  address: {
    displayName: {
      text: string;
    };
    location: {
      longitude: number;
      latitude: number;
    };
  };

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
  address?: Address;

  @IsOptional()
  @IsString()
  activity?: string;
}

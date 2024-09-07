import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Address } from 'src/modules/company/address.entity';

export class CreateCompanyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  razonSocial: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  cuit?: number;

  @ApiProperty()
  @IsNotEmpty()
  address: Address;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  activity: string;
}

export class GetCompanyDto {
  @ApiProperty()
  @IsUUID('4')
  id: string;
}

export class UpdateCompanyDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  address?: Address;

  @ApiProperty()
  @IsOptional()
  @IsString()
  activity?: string;
}

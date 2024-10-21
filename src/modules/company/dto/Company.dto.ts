import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Branch } from 'src/modules/company/branch.entity';

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
  cuit: number;

  @ApiProperty()
  @IsNotEmpty()
  branch: Branch;

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
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  activity: string;

  @IsOptional()
  branch?: Branch;
}

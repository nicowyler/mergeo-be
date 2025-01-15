import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Address } from 'src/modules/company/entities/address.entity';
import { Branch } from 'src/modules/company/entities/branch.entity';

export class CreateBranchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsMobilePhone('es-AR', { strictMode: false })
  phoneNumber?: string;

  @ApiProperty()
  @IsBoolean()
  isMain?: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  address: Address;
}

export class CompanyDtoResponse {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  branches: Branch[];
}

export class CreateBranchResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email?: string;

  @ApiProperty()
  @Expose()
  phoneNumber?: string;

  @ApiProperty()
  @Expose()
  address: Address;
}

export class UpdateBranchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsMobilePhone('es-AR')
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  address?: Address;
}

class CompanyResponseDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  branches: {
    name: string;
    id: string;
  }[];
}

export class BranchesResponseDto {
  @ApiProperty({ type: () => CompanyResponseDto })
  @Type(() => CompanyResponseDto)
  company: CompanyResponseDto;
}

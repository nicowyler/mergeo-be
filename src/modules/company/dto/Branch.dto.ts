import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsMobilePhone('es-AR')
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  locality: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  zipCode: number;
}

export class CompanyDtoResponse {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
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
  email: string;

  @ApiProperty()
  @Expose()
  phoneNumber: string;

  @ApiProperty()
  @Expose()
  address: string;

  @ApiProperty()
  @Expose()
  province: string;

  @ApiProperty()
  @Expose()
  locality: string;

  @ApiProperty()
  @Expose()
  zipCode: number;

  @ApiProperty({ type: () => [CompanyDtoResponse] })
  @Expose()
  @Type(() => CompanyDtoResponse)
  company: CompanyDtoResponse;
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
  address?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  locality?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  zipCode?: number;
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

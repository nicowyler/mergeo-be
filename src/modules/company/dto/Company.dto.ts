import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { transformPolygonToLocation } from 'src/common/utils/postGis.utils';
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
  @Transform(({ value }) => transformPolygonToLocation(value), {
    toClassOnly: true,
  })
  address?: Address;

  @ApiProperty()
  @IsOptional()
  @IsString()
  activity?: string;
}

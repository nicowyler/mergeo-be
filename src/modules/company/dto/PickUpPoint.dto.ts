import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  transformLocationToPolygon,
  transformPolygonToLocation,
} from 'src/common/utils/postGis.utils';
import { Address } from 'src/modules/company/address.entity';
import { PickUpSchedule } from 'src/modules/company/pickUpPoints/pickUpSchedule.entity';

export class PickUpPointDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsMobilePhone('es-AR', { strictMode: false })
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  @Transform(({ value }) => transformPolygonToLocation(value), {
    toClassOnly: true,
  })
  @Transform(({ value }) => transformLocationToPolygon(value), {
    toPlainOnly: true,
  })
  address: Address;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  schedules: PickUpSchedule[];
}

export class UpdatePickUpPoint {
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
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => transformPolygonToLocation(value), {
    toClassOnly: true,
  })
  @Transform(({ value }) => transformLocationToPolygon(value), {
    toPlainOnly: true,
  })
  address: Address;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  schedules: PickUpSchedule[];
}

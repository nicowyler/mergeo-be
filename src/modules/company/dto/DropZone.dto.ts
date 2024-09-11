import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { transformPolygonToLocation } from 'src/common/utils/postGis.utils';
import { ZoneAddress } from 'src/modules/company/address.entity';
import { DropZoneSchedule } from 'src/modules/company/dropZones/dropZoneSchedule.entity';

export class DropZoneDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  address: ZoneAddress;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  schedules: DropZoneSchedule[];
}

export class UpdateDropZoneDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  @IsOptional()
  address: ZoneAddress;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  schedules: DropZoneSchedule[];
}

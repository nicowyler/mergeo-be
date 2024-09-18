import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { DropZoneSchedule } from 'src/modules/company/dropZones/dropZoneSchedule.entity';
import { Polygon } from 'typeorm';

export class DropZoneDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  zone: Polygon;

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
  zone: Polygon;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  schedules: DropZoneSchedule[];
}

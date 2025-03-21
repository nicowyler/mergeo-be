import {
  IsOptional,
  IsString,
  IsUUID,
  IsDate,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UUID } from 'crypto';
import { GenericFilter, SortOrder } from 'src/common/pagination/generic.filter';

class PickUpAreaDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  radius: number;
}

export class SearchProductsDto {
  @IsUUID()
  branchId: UUID;

  @IsOptional()
  @IsDate()
  @Type(() => Date) // Transform query string into a Date
  expectedDeliveryStartDay?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date) // Transform query string into a Date
  expectedDeliveryEndDay?: Date;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  startHour?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  endHour?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  baseMeasurementUnit?: string = 'grams';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isPickUp?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickUpLng?: number; // Pick-up longitude

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickUpLat?: number; // Pick-up latitude

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickUpRadius?: number; // Pick-up radius

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  onlyFavorites?: boolean;
}

export class PaginatedSearchProductsDto extends GenericFilter {
  @IsUUID()
  branchId: UUID;

  @IsOptional()
  @IsDate()
  @Type(() => Date) // Transform query string into a Date
  expectedDeliveryStartDay?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date) // Transform query string into a Date
  expectedDeliveryEndDay?: Date;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  startHour?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  endHour?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  baseMeasurementUnit?: string = 'grams';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isPickUp?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickUpLng?: number; // Pick-up longitude

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickUpLat?: number; // Pick-up latitude

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pickUpRadius?: number; // Pick-up radius

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  onlyFavorites?: boolean;
}

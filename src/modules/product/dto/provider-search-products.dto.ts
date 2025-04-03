import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { UUID } from 'crypto';

export class ProviderSearchPrdoucDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  ean?: string;

  @IsOptional()
  @IsString()
  companyId?: UUID;

  @IsString()
  includeInventory: string;
}

export class NewSearchPrdoucDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  ean?: string;

  @IsOptional()
  @IsString()
  companyId?: UUID;
}

export class ProviderProductResponseDto {
  @Expose()
  @IsString()
  gtin: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  @IsOptional()
  measurementUnit: string;

  @Expose()
  @IsString()
  @IsOptional()
  unitConversionFactor: number;

  @Expose()
  @IsString()
  @IsOptional()
  description?: string;

  @Expose()
  @IsString()
  @IsOptional()
  brand: string;

  @Expose()
  @IsString()
  @IsOptional()
  variety?: string;

  @Expose()
  @IsString()
  @IsOptional()
  netContent?: number;

  @Expose()
  @IsString()
  @IsOptional()
  segment?: string;

  @Expose()
  @IsString()
  @IsOptional()
  family?: string;

  @Expose()
  @IsString()
  @IsOptional()
  image?: string;

  @Expose()
  @IsNumber()
  @IsOptional()
  units?: number;

  @Expose()
  @IsString()
  @IsOptional()
  manufacturer_name?: string;

  @Expose()
  @IsString()
  @IsOptional()
  manufacturer_id?: string;

  @Expose()
  @IsString()
  @IsOptional()
  manufacturer_country?: string;

  @Expose()
  @IsNumber()
  @IsOptional()
  price?: number;

  @Expose()
  @IsNumber()
  @IsOptional()
  isInInventory?: boolean;
}

export class ProductResponseDto extends ProviderProductResponseDto {
  @Expose()
  @IsNumber()
  @IsOptional()
  id?: UUID;

  @Expose()
  @IsNumber()
  @IsOptional()
  price?: number;

  @Expose()
  @IsNumber()
  @IsOptional()
  updated?: Date;
}

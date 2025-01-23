import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UUID } from 'crypto';

export class CreateProductsListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsArray()
  companies: UUID[];
}

export class UpdateProductsListDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsArray()
  @IsOptional()
  companies: UUID[];
}

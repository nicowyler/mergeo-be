import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
}

import { IsString, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

// DTO for SearchListProduct
export class SearchListProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  category: string;
}

// DTO for creating a SearchList
export class CreateSearchListDto {
  @IsString()
  name: string;

  @IsString()
  createdBy: string;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => SearchListProductDto)
  products: SearchListProductDto[];
}

// DTO for updating a SearchList
export class UpdateSearchListDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  createdBy?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SearchListProductDto)
  products?: SearchListProductDto[];
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  category?: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;
}

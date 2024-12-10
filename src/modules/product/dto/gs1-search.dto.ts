import { IsOptional, IsString } from 'class-validator';

export class Gs1SearchProductsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  netContent?: number;
}

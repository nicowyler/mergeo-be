import { IsOptional, IsString } from 'class-validator';

export class PrdouctInlistDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  netContent?: number;

  @IsOptional()
  @IsString()
  measurmentUnit?: string;
}

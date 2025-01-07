import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class GtinProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  gtin: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;
}

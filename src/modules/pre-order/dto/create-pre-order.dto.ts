import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { UUID } from 'crypto';
import { ReplacementCriteria } from 'src/common/enum/replacementCriteria.enum';
import { SearchProductsDto } from 'src/modules/product/dto/search-products.dto';

export class CartProductDto {
  @IsUUID()
  id: UUID;

  @IsNumber()
  quantity: number;

  @IsUUID()
  providerId: UUID; //this is the company id
}

export class CreatePreOrderDto {
  @IsEnum(ReplacementCriteria)
  replacementCriteria: ReplacementCriteria;

  @ValidateNested()
  @Type(() => SearchProductsDto)
  searchParams: SearchProductsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartProductDto)
  cartProducts: CartProductDto[];
}

export class ProcessProviderResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartProductDto)
  acceptedProducts: CartProductDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartProductDto)
  rejectedProducts: CartProductDto[];
}

import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { UUID } from 'crypto';

export enum ReplacementCriteria {
  BEST_PRICE_SAME_UNIT = 'best_price_same_unit',
  SAME_PRICE_SAME_UNIT = 'same_price_same_unit',
  SAME_PRODUCT_ANOTHER_UNIT = 'same_product_another_unit',
}

export const Instance = [
  'primera-instancia',
  'segunda-instancia',
  'tercera-instancia',
  'cuarta-instancia',
  'quinta-instancia',
];

export class SearchCriteriaDto {
  @IsUUID()
  branchId: UUID;

  @IsDate()
  expectedDeliveryStartDay: Date;

  @IsDate()
  expectedDeliveryEndDay: Date;

  @IsNumber()
  startHour: number;

  @IsNumber()
  endHour: number;

  @IsString()
  brand?: string;

  @IsString()
  name?: string;

  @IsString()
  measurementUnit?: string;

  @IsBoolean()
  isPickUp?: boolean;

  @IsNumber()
  pickUpLat?: number;

  @IsNumber()
  pickUpLng?: number;

  @IsNumber()
  pickUpRadius?: number;

  @IsEnum(ReplacementCriteria)
  replacementCriteria: ReplacementCriteria;
}

import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { UUID } from 'crypto';
import { ReplacementCriteria as RP } from 'src/common/enum/replacementCriteria.enum';

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

  @IsEnum(RP)
  replacementCriteria: RP;
}

import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GenericFilter {
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) || num < 1 ? 1 : num;
  })
  @IsNumber({}, { message: '"page" attribute should be a number' })
  public page: number;

  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) || num < 1 ? 10 : num;
  })
  @IsNumber({}, { message: '"pageSize" attribute should be a number' })
  public pageSize: number;

  @IsOptional()
  public orderBy?: string;

  @IsEnum(SortOrder)
  @IsOptional()
  public sortOrder?: SortOrder = SortOrder.DESC;
}

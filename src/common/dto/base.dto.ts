import { IsNumber } from 'class-validator';

export class BaseResponseDTO<T> {
  @IsNumber()
  count: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  data: T[];
}

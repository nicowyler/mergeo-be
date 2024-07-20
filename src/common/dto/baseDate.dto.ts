import { IsDate, IsOptional } from 'class-validator';

export class BaseDateResponseDTO {
  @IsDate()
  @IsOptional()
  created: Date;

  @IsDate()
  @IsOptional()
  updated: Date;
}

import { IsString, IsUUID } from 'class-validator';

export class GetUserDto {
  @IsUUID('4')
  id: string;

  @IsString()
  accountType?: string[];
}

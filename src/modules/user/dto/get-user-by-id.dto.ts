import { IsUUID } from "class-validator";

export class GetUserByIdDto {
  @IsUUID('4')
  id: string;
}

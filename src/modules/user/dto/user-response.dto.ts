import { IsString, IsUUID } from "class-validator";
import { CreateUserDto } from "./create-user.dto";
import { Exclude } from "class-transformer";

export class UserResponseDto extends CreateUserDto {
  @IsUUID()
  id: string;

  @Exclude()
  password: string;

  @Exclude()
  email_verified: string;

  @Exclude()
  activationCode: string;
}

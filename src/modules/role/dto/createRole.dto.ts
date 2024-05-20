import { Permission } from '@/modules/role/permission.entity';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  userId: string;

  @IsArray()
  permissions: Permission[];
}

export class ResponseCreateRoleDto extends CreateRoleDto {}

import { Role } from 'src/modules/role/role.entity';
import { Permission } from '../../../modules/role/permission.entity';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsArray()
  permissions: Permission[];
}

export class ResponseCreateRoleDto extends CreateRoleDto {}

export class GetRoleDto {
  @IsNotEmpty()
  @IsUUID()
  companyId: string;

  @IsArray()
  roles: Pick<Role, 'name' | 'id' | 'permissions'>[];
}

export class UpdateRoleDto extends CreateRoleDto {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsArray()
  permissions: Permission[];
}

export class AddRolesToUserDto {
  @IsArray()
  roles: Pick<Role, 'id'>[];
}

import { Roles } from 'src/modules/role/role.entity';
import { Permission } from '../../../modules/role/permission.entity';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsArray()
  permissions: Permission[];
}

export class ResponseCreateRoleDto extends CreateRoleDto {}

export class GetRoleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  companyId: string;

  @ApiProperty()
  @IsArray()
  roles: Pick<Roles, 'name' | 'id' | 'permissions'>[];
}

export class UpdateRoleDto extends CreateRoleDto {
  @ApiProperty()
  @IsOptional()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  permissions: Permission[];
}

export class AddRolesToUserDto {
  @ApiProperty()
  @IsArray()
  roles: Pick<Roles, 'id'>[];
}

import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { TransformInterceptor } from '../../interceptors/response.interceptor';
import { ResponseMessage } from '../../decorators/response_message.decorator';
import { AuthGuard } from '../../guards';
import { Permission } from '../../modules/role/permission.entity';
import { GetRoleDto } from 'src/modules/role/dto/role.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Roles')
@UseInterceptors(TransformInterceptor)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('/permissions')
  @UseGuards(AuthGuard)
  @ResponseMessage('Permissions encontrados con exito!')
  async permissions(): Promise<Permission[]> {
    return await this.roleService.getPermissions();
  }

  @Get(':companyId')
  @UseGuards(AuthGuard)
  @ResponseMessage('Permissions encontrados con exito!')
  async getRoles(
    @Param('companyId', new ParseUUIDPipe()) companyId: string,
  ): Promise<GetRoleDto> {
    return await this.roleService.getRoles(companyId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Role borrado con exito!')
  async deleteRoles(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return await this.roleService.deleteRole(id);
  }
}

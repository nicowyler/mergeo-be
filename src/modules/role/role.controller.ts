import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { TransformInterceptor } from '@/interceptors/response.interceptor';
import { ResponseMessage } from '@/decorators/response_message.decorator';
import { AuthGuard } from '@/guards';
import { Permission } from '@/modules/role/permission.entity';
import { Role } from '@/modules/role/role.entity';
import { CreateRoleDto } from '@/modules/role/dto';
import { ResponseCreateRoleDto } from '@/modules/role/dto/createRole.dto';

@UseInterceptors(TransformInterceptor)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ResponseMessage('Rol creado con exito!')
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<ResponseCreateRoleDto> {
    return await this.roleService.createRole(createRoleDto);
  }

  @Get('/permissions')
  @UseGuards(AuthGuard)
  @ResponseMessage('Permissions encontrados con exito!')
  async permissions(): Promise<Permission[]> {
    return await this.roleService.getPermissions();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Roles de Usuario encontrados con exito!')
  async roles(@Param() params): Promise<Role[]> {
    return await this.roleService.getUserRoles(params.id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto, UserResponseDto } from './dto';
import { TransformInterceptor } from '../../interceptors/response.interceptor';
import { ResponseMessage } from '../../decorators/response_message.decorator';
import { plainToInstance } from 'class-transformer';
import { AuthGuard, PermissionsGuard } from '../../guards';
import { PERMISSIONS } from '../../common/enum/permissions.enum';
import { CreateRoleDto } from 'src/modules/role/dto';
import { AddRolesToUserDto } from 'src/modules/role/dto/role.dto';
import { GetUsersDto } from 'src/modules/user/dto/user.dto';
import { ApiTags } from '@nestjs/swagger';
import { RoleService } from 'src/modules/role/role.service';
import { Roles } from 'src/modules/role/role.entity';

@ApiTags('Usuario')
@UseInterceptors(TransformInterceptor)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  @ResponseMessage('Usuarios encontrados con exito!')
  async users(@Query() param: GetUsersDto): Promise<UserResponseDto[]> {
    // ID = company ID
    const users = await this.userService.getUsers(param.id);
    const allPermissions = await this.roleService.getPermissions();

    const usersList = [];
    users.forEach((item) => {
      const updatedRoles = item.roles.map((role) => {
        const updatedPermissions = allPermissions.map((perm) => ({
          id: perm.id,
          name: perm.name,
          group: perm.group,
          action: perm.action,
          hasPermission: role.permissions.some((r) => r.name === perm.name),
        }));

        return plainToInstance(Roles, {
          ...role,
          permissions: updatedPermissions,
        });
      });

      const userResponseDto = new UserResponseDto();
      userResponseDto.id = item.id;
      userResponseDto.name = item.firstName + ' ' + item.lastName;
      userResponseDto.email = item.email;
      userResponseDto.isActive = item.email_verified;
      userResponseDto.roles = updatedRoles;
      userResponseDto.created = item.created;
      userResponseDto.updated = item.updated;
      usersList.push(userResponseDto);
    });

    return usersList;
  }

  @Get('/:id')
  @ResponseMessage('Usuario encontrado!')
  @UseGuards(AuthGuard)
  async getUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.userService.getUser(id);
    return plainToInstance(UserResponseDto, user);
  }

  @Patch('/:id')
  @SetMetadata('permissions', [PERMISSIONS.EDIT_USERS.name])
  @UseGuards(AuthGuard, PermissionsGuard)
  @ResponseMessage('Usuario actualizado!')
  async editUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserDto,
  ): Promise<UpdateUserDto> {
    const updatedUser = await this.userService.editUser(id, body);
    return plainToInstance(UpdateUserDto, updatedUser);
  }

  @Delete('/:id')
  @SetMetadata('permissions', [PERMISSIONS.DELETE_USERS.name])
  @UseGuards(AuthGuard, PermissionsGuard)
  @ResponseMessage('El usuario a sido borrado con exito!')
  async removeUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    const deletedUser = await this.userService.removeUser(id);
    const userResponseDto = new UserResponseDto();
    userResponseDto.id = deletedUser.id;

    return userResponseDto;
  }

  // ----- ROLES ----- //
  @Post('/:id/role')
  @ResponseMessage('Role creado con exito!')
  async createUserRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: CreateRoleDto,
  ): Promise<UserResponseDto> {
    const createdRole = await this.userService.createUserRoles(id, body);
    return plainToInstance(UserResponseDto, createdRole);
  }

  @Delete('/:id/role/:roleId')
  @ResponseMessage('Role borrado con exito!')
  async deleteUserRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('roleId', new ParseUUIDPipe()) roleId: string,
  ): Promise<UserResponseDto> {
    const deletedRole = await this.userService.deleteUserRole(id, roleId);
    return plainToInstance(UserResponseDto, deletedRole);
  }

  @Patch('/:id/addRole')
  @ResponseMessage('Role agregado con exito!')
  async updateUserRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: AddRolesToUserDto,
  ): Promise<UserResponseDto> {
    const updatedRole = await this.userService.addRolesToUser(id, body.roles);
    return plainToInstance(UserResponseDto, updatedRole);
  }

  @Post('/testEmail')
  @ResponseMessage('Email enviado!')
  async sendTestEmail(@Body('emailType') emailType: string) {
    await this.userService.sendTestEmail(emailType);
    return true;
  }

  @Post('/testWhatsapp')
  @ResponseMessage('Whatsapp enviado!')
  async sendWhatsapp() {
    await this.userService.sendWhatsAppMessage();
    return true;
  }
}

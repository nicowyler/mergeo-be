import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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

@UseInterceptors(TransformInterceptor)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ResponseMessage('Usuarios encontrados con exito!')
  async users(): Promise<UserResponseDto[]> {
    const users = await this.userService.getUsers();

    const usersList = [];
    users.forEach((item) => {
      const userResponseDto = new UserResponseDto();
      userResponseDto.id = item.id;
      userResponseDto.email = item.email;
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
  @SetMetadata('permissions', [PERMISSIONS.EDIT_USERS])
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
  @SetMetadata('permissions', [PERMISSIONS.DELETE_USERS])
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

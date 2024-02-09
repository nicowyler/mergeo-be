import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  SetMetadata,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { TransformInterceptor } from '@/interceptors/response.interceptor';
import { ResponseMessage } from '@/decorators/response_message.decorator';
import { plainToInstance } from 'class-transformer';
import { GetUserByIdDto } from './dto/get-user-by-id.dto';
import { validate } from 'class-validator';
import { AuthGuard } from '@/guards';
import { Role } from '@/common/enum';

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

  @Get(':id')
  @ResponseMessage('Usuario encontrado!')
  @UseGuards(AuthGuard)
  async getUser(@Param() params): Promise<UserResponseDto> {
    const idInstance = plainToInstance(GetUserByIdDto, params);
    const isValidUUID = await validate(idInstance);
    if (isValidUUID.length) {
      throw new BadRequestException(isValidUUID[0].constraints.isUuid);
    }
    const user = await this.userService.getUser(idInstance.id);
    return plainToInstance(UserResponseDto, user);
  }

  @Post()
  @ResponseMessage('Usuario Creado con exito!')
  async createUser(@Body() body: CreateUserDto): Promise<void> {
    await this.userService.createUser(body);
  }

  @Patch(':id')
  @ResponseMessage('Usuario actualizado!')
  @UseGuards(AuthGuard)
  async editUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<UpdateUserDto> {
    const updatedUser = await this.userService.editUser(id, body);
    return plainToInstance(UpdateUserDto, updatedUser);
  }

  @Delete(':id')
  @SetMetadata('role', Role.ADMIN)
  @UseGuards(AuthGuard)
  @ResponseMessage('El usuario a sido borrado con exito!')
  async removeUser(@Param('id') id: string): Promise<UserResponseDto> {
    const deletedUser = await this.userService.removeUser(id);
    const userResponseDto = new UserResponseDto();
    userResponseDto.id = deletedUser.id;

    return userResponseDto;
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

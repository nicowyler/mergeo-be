import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseMessage } from '../../decorators/response_message.decorator';
import { Response } from 'express';
import {
  LoginDto,
  NewPasswordDto,
  PasswordRecoverDto,
  RegisterCompanyDto,
  RegisterUserDto,
  ValidateUserDto,
} from './dto';
import { TypedEventEmitter } from '../../modules/event-emitter/typed-event-emitter.class';
import { ConfigService } from '@nestjs/config';
import { TransformInterceptor } from '../../interceptors/response.interceptor';
import { UserService } from '../../modules/user/user.service';
import {
  AddUserDto,
  AuthDto,
  RequestUserDto,
  RefreshTokenResponseDto,
} from './dto/auth.dto';
import { RefreshGuard } from '../../guards/refresh.guard';
import { Emails } from 'src/common/enum';
import { AuthenticatedRequest } from 'src/common/interface/AuthenticatedRequest.inteeface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Autentificación')
@UseInterceptors(TransformInterceptor)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly eventEmitter: TypedEventEmitter,
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('/verify')
  @ResponseMessage('La cuenta fue validada con exito!')
  async verifyEmail(@Body() validateUserDto: ValidateUserDto) {
    const { email, activationCode } = validateUserDto;
    const validUser = await this.authService.validateUserEmail(
      email,
      activationCode,
    );
    if (!validUser) {
      throw new UnauthorizedException();
    }
  }

  @ResponseMessage('Usuario Registrado!')
  @Post('/register/user')
  async registerUser(@Body() regiserUserDto: RegisterUserDto) {
    await this.authService.registerUser(regiserUserDto);
    return {};
  }

  @ResponseMessage('Compania Registrada!')
  @Post('/register/company')
  async registerCompany(@Body() regiserCompanyDto: RegisterCompanyDto) {
    const response = await this.authService.registerCompany(regiserCompanyDto);
    return { companyId: response.company.id };
  }

  @ResponseMessage('Usuaurio Agregado!')
  @Post(':id/add/user')
  async addNewUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() addUserDto: AddUserDto,
  ) {
    await this.authService.addUser(id, addUserDto);
    return {};
  }

  @Post('/login')
  @ResponseMessage('Usuario Logueado!')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthDto> {
    const { email, password } = loginDto;
    const validUser = await this.authService.validateUser(email, password);
    if (!validUser) {
      throw new UnauthorizedException();
    }
    const tokens = await this.authService.generateAccessToken(validUser);
    const {
      id,
      firstName,
      lastName,
      email: userEmail,
      accountType,
      company,
    } = validUser;

    response.cookie('tokens', tokens, {
      httpOnly: true,
      sameSite: false,
      secure: true,
    });

    const authDto = new AuthDto();
    authDto.user = {
      id: id,
      email: userEmail,
      accountType: accountType,
      name: `${firstName} ${lastName}`,
    };
    authDto.company = company;

    return authDto;
  }

  @Post('/logout')
  @ResponseMessage('te has deslogueado exitosamente! chau chau')
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.clearCookie('tokens');

    return {};
  }

  @Post('/password-recover')
  @ResponseMessage('Email de de recuperacion de password enviado!')
  async editPassword(@Body() passwordRecoverDto: PasswordRecoverDto) {
    const { email } = passwordRecoverDto;
    const token = await this.authService.resetPasswordTokenGeneration(email);

    if (token) {
      this.eventEmitter.emit(Emails.ResetPassword, {
        link: `${this.config.get('USER_HOST')}/passwordReset?token=${token}`,
        email: email,
      });
    }
  }

  @Post('/new-password')
  @ResponseMessage('Tu contraseña ha sido cambiada con exito!')
  async changePassword(@Body() newPasswordDto: NewPasswordDto) {
    const { password: newPassword, token } = newPasswordDto;
    const { password: oldPassword, id } =
      await this.authService.newPasswordTokenVerification(token);

    if (oldPassword) {
      await this.userService.changePasword(id, oldPassword, newPassword);
    }
  }

  @UseGuards(RefreshGuard)
  @Get('/refresh')
  @ResponseMessage('Token refresh success!')
  async refreshToken(
    @Request() req: RequestUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('refreshed');
    const tokens = await this.authService.generateAccessToken(req.user);
    const { access_token, refresh_token, expiresIn } = tokens;
    const refreshTokenDto = new RefreshTokenResponseDto();
    refreshTokenDto.tokens = {
      access_token,
      refresh_token,
      expiresIn,
    };

    response.cookie('tokens', tokens, {
      httpOnly: true,
      sameSite: false,
      secure: true,
    });

    return true;
  }

  @Get('/helpers')
  @ResponseMessage('Helpers success!')
  async helpers(@Query() query: { type?: string; params?: string }) {
    const { type, params } = query;
    const response = await this.authService.helpers(type, params);
    return response;
  }
}

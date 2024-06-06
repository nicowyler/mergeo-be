import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResponseMessage } from '../../decorators/response_message.decorator';
import { Response, response } from 'express';
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
import { AuthGuard } from '../../guards';
import { AuthenticatedRequest } from '../../common/interface/AuthenticatedRequest.inteeface';
import { UserService } from '../../modules/user/user.service';
import {
  AddUserDto,
  AuthDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from './dto/auth.dto';
import { RefreshGuard } from '../../guards/refresh.guard';
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

    const tokens = await this.authService.generateAccessToken(validUser);
    const {
      id,
      firstName,
      lastName,
      email: userEmail,
      accountType,
    } = validUser;

    const authDto = new AuthDto();

    authDto.user = {
      id: id,
      email: userEmail,
      accountType: accountType,
      name: `${firstName} ${lastName}`,
    };

    response.cookie('tokens', tokens, {
      httpOnly: true,
      sameSite: false,
      secure: true,
    });

    return authDto;
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
    await this.authService.registerCompany(regiserCompanyDto);
    return {};
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

    return authDto;
  }

  @Post('/password-recover')
  @ResponseMessage('Email de de recuperacion de password enviado!')
  async editPassword(@Body() passwordRecoverDto: PasswordRecoverDto) {
    const { email } = passwordRecoverDto;
    const validEmail = await this.authService.isValidEmail(email);

    if (validEmail) {
      this.eventEmitter.emit('user.reset-password', {
        link: `${this.config.get('USER_HOST')}?token=${validEmail.password}`,
        email: email,
      });
    }
  }

  @Post('/new-password')
  @UseGuards(AuthGuard)
  @ResponseMessage('Tu contraseña ha sido cambiada con exito!')
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() newPasswordDto: NewPasswordDto,
  ) {
    const { email } = request.user;
    const { password } = newPasswordDto;

    const isValidUser = await this.authService.isValidEmail(email);

    if (isValidUser) {
      await this.userService.changePasword(isValidUser.id, password);
    }
  }

  @UseGuards(RefreshGuard)
  @Get('/refresh')
  @ResponseMessage('Token refresh success!')
  async refreshToken(
    @Request() req: RefreshTokenDto,
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
}

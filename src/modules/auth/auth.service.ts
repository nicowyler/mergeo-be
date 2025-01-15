import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../modules/user/user.service';
import { EncoderService } from '../../modules/auth/encoder.service';
import { ConfigService } from '@nestjs/config';
import { ErrorMessages } from '../../common/enum';
import { User } from '../user/user.entity';
import {
  AddUserDto,
  RegisterCompanyDto,
  RegisterUserDto,
  UserDto,
} from '../../modules/auth/dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RoleService } from 'src/modules/role/role.service';
import { CompanyService } from 'src/modules/company/services/company.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private companyService: CompanyService,
    private jwtTokenService: JwtService,
    private encodderService: EncoderService,
    private roleService: RoleService,
    private _config: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async registerUser(regiserDto: RegisterUserDto): Promise<any> {
    const activationCode = this.encodderService.generateActivationCode();
    const company = await this.companyService.getCompanyById(
      regiserDto.companyId,
    );
    const user: User = await this.userService.createUser(
      regiserDto,
      company,
      activationCode,
    );

    await this.roleService.createAdminRole(company.id, user);
  }

  async registerCompany(regiserDto: RegisterCompanyDto): Promise<any> {
    return await this.companyService.createCompany(regiserDto);
  }

  async addUser(id: string, userDto: AddUserDto): Promise<any> {
    const company = await this.companyService.getCompanyById(userDto.companyId);

    return await this.userService.addNewUser(id, userDto, company);
  }

  async validateUserEmail(email: string, activationCode: string): Promise<any> {
    const user = await this.userService.getUserByEmail(email);
    let dbCode = { activationCode: '' };
    if (!user.email_verified) {
      try {
        dbCode = await this.jwtTokenService.verifyAsync(user.activationCode, {
          secret: this._config.get('SECRET_VERIFICATION_CODE'),
        });
      } catch (error) {
        if (error?.name === 'TokenExpiredError') {
          // If the code has expired we save the new one in the DB and re-send the email
          const newActivationCode =
            this.encodderService.generateActivationCode();
          this.userService.resendActivationCode(user, newActivationCode);
          throw new BadRequestException(ErrorMessages.ACTIVATION_CODE_EXPIRED);
        }
      }

      if (dbCode.activationCode == activationCode) {
        await this.userService.verifyEmailCheck(user.id, true);
        return true;
      } else {
        throw new BadRequestException(ErrorMessages.ACTIVATION_CODE_NOT_VALID);
      }
    } else {
      throw new BadRequestException(ErrorMessages.ACCOUNT_ALREADY_VALIDATED);
    }
  }

  async newPasswordTokenVerification(
    token: string,
  ): Promise<{ password: string; id: string }> {
    const { email, password } = await this.jwtTokenService.verifyAsync(token, {
      secret: this._config.get('SECRET_PASSWORD_RESET'),
    });

    try {
      const user = await this.userService.getUserByEmail(email);
      if (user) {
        if (user.email_verified) {
          // check token data against db data
          if (email == user.email && password == user.password) {
            return { password: password, id: user.id };
          } else {
            throw new BadRequestException(
              ErrorMessages.USER_PASSWORD_RESET_LINK_NOT_VALID,
            );
          }
        } else {
          throw new BadRequestException(ErrorMessages.USER_EMAIL_NOT_VERIFIED);
        }
      } else {
        throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
      }
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        // If the code has expired we save the new one in the DB and re-send the email
        const newActivationCode = this.encodderService.generateActivationCode();
        this.userService.resendPasswordRecover(email, newActivationCode);
        throw new BadRequestException(
          ErrorMessages.USER_PASSWORD_RESET_LINK_EXPIRED,
        );
      }
    }
  }

  async resetPasswordTokenGeneration(email: string): Promise<string> {
    const user = await this.userService.getUserByEmail(email);
    // if user is already verified we return the token
    if (user.email_verified) {
      const token = this.jwtTokenService.sign(
        { email: user.email, password: user.password },
        {
          privateKey: this._config.get('SECRET_PASSWORD_RESET'),
          expiresIn: this._config.get('SECRET_PASSWORD_RESET_EXPIRATION'),
        },
      );

      return token;
    } else {
      throw new BadRequestException(ErrorMessages.USER_EMAIL_NOT_VERIFIED);
    }
  }

  async isValidEmail(email: string): Promise<User> {
    const user = await this.userService.getUserByEmail(email);
    return user;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.getUserByEmail(email);

    const isValidPassword = await this.encodderService.compareHashedPassword(
      password,
      user.password,
    );

    if (!user.email_verified) {
      throw new UnauthorizedException(ErrorMessages.USER_EMAIL_NOT_VERIFIED);
    }

    if (isValidPassword) {
      const { password, ...result } = user;
      return result;
    } else {
      throw new UnauthorizedException(ErrorMessages.USER_NOT_AUTH);
    }
  }

  async helpers(type: string, params: string) {
    const url = `https://apis.datos.gob.ar/georef/api/${type}?${params}`;
    try {
      const { data } = await firstValueFrom(this.httpService.get(url));
      return data;
    } catch (err) {
      throw new Error(err);
    }
  }

  async generateAccessToken(user: UserDto) {
    const EXPIRE_TIME = 20 * 1000;
    const payload = {
      email: user.email,
      id: user.id,
      accountType: user.accountType,
    };
    const secret = this._config.get('SECRET');
    const refresh_secret = this._config.get('REFRESH_SECRET');
    return {
      access_token: this.jwtTokenService.sign(payload, {
        privateKey: secret,
        expiresIn: this._config.get('TOKEN_EXPIRATION'),
      }),
      refresh_token: this.jwtTokenService.sign(payload, {
        privateKey: refresh_secret,
        expiresIn: this._config.get('REFRESH_TOKEN_EXPIRATION'),
      }),
      expiresIn: new Date().setTime(new Date().getTime() + EXPIRE_TIME),
    };
  }
}

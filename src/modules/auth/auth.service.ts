import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '@/modules/user/user.service';
import { EncoderService } from '@/modules/auth/encoder.service';
import { ConfigService } from '@nestjs/config';
import { ErrorMessages } from '@/common/enum';
import { User } from '../user/user.entity';
import { UserDto } from './dto/auth.dto';
import { RegisterCompanyDto, RegisterUserDto } from '@/modules/auth/dto';
import { CompanyService } from '@/modules/company/company.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private companyService: CompanyService,
    private jwtTokenService: JwtService,
    private encodderService: EncoderService,
    private _config: ConfigService,
  ) {}

  async registerUser(regiserDto: RegisterUserDto): Promise<any> {
    const activationCode = this.encodderService.generateActivationCode();
    const company = await this.companyService.getCompanyById(
      regiserDto.companyId,
    );
    await this.userService.createUser(regiserDto, company, activationCode);
  }

  async registerCompany(regiserDto: RegisterCompanyDto): Promise<any> {
    await this.companyService.createCompany(regiserDto);
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

  async generateAccessToken(user: UserDto) {
    const EXPIRE_TIME = 20 * 1000;
    const payload = {
      email: user.email,
      sub: user.id,
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

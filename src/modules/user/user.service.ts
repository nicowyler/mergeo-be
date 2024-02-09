import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EncoderService } from '../auth/encoder.service';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Emails, ErrorMessages } from 'src/common/enum';
import { TypedEventEmitter } from '@/modules/event-emitter/typed-event-emitter.class';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WhatsApp } from '@/common/enum/email.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private encoderService: EncoderService,
    private readonly eventEmitter: TypedEventEmitter,
    private jwtTokenService: JwtService,
    private _config: ConfigService,
  ) {}
  async createUser(createUserDto: CreateUserDto, activationCode?: string) {
    const { password } = createUserDto;
    const hashedPassword = await this.encoderService.encodePassword(password);

    const hashedActivationCode = this.jwtTokenService.sign(
      { activationCode },
      {
        secret: this._config.get('SECRET_VERIFICATION_CODE'),
        expiresIn: '1h',
      },
    );

    const user = this.userRepository.create({
      ...createUserDto,
      activationCode: hashedActivationCode,
      password: hashedPassword,
    });

    try {
      this.eventEmitter.emit('user.verify-email', {
        name: createUserDto.firstName,
        email: createUserDto.email,
        activationCode: activationCode,
      });
      await this.userRepository.save(user);
    } catch (error) {
      if (error.code === '23505')
        throw new ConflictException(ErrorMessages.USER_EMAIL_EXISTS);
      else {
        throw new InternalServerErrorException();
      }
    }
  }

  async resendActivationCode(user: User, activationCode: string) {
    const hashedActivationCode = this.jwtTokenService.sign(
      { activationCode },
      {
        secret: this._config.get('SECRET_VERIFICATION_CODE'),
        expiresIn: '1m',
      },
    );

    const { id, firstName, email } = user;
    try {
      await this.userRepository.save({
        id,
        ...{ activationCode: hashedActivationCode },
      });
      this.eventEmitter.emit('user.verify-email', {
        name: firstName,
        email: email,
        activationCode: activationCode,
      });
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  async getUser(id: string): Promise<User> {
    const user: User = await this.userRepository.findOneBy({
      id: id,
    });

    if (!user)
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user: User = await this.userRepository.findOneBy({
      email: email,
    });

    if (!user)
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${email}`);

    return user;
  }

  async editUser(id: string, body: UpdateUserDto): Promise<UpdateUserDto> {
    try {
      const user = await this.userRepository.save({ id, ...body });
      let updatedUser = new UpdateUserDto();
      updatedUser = user;
      return updatedUser;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async changePasword(id: string, password: string): Promise<boolean> {
    try {
      const hashedPassword = await this.encoderService.encodePassword(password);
      await this.userRepository.save({
        id,
        ...{ password: hashedPassword },
      });
      return true;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async verifyEmailCheck(id: string, email_verified: boolean): Promise<User> {
    try {
      const user = await this.userRepository.save({ id, email_verified });
      return user;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async removeUser(id: string): Promise<User> {
    const user: User = await this.userRepository.findOneBy({ id: id });

    if (!user)
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);

    this.userRepository.remove(user);

    return user;
  }

  async sendTestEmail(type: string) {
    const indexOfS = Object.values(Emails).indexOf(type as unknown as Emails);
    const emailType: string = Object.values(Emails)[indexOfS];

    if (emailType === Emails.VerifyEmail) {
      this.eventEmitter.emit(Emails.VerifyEmail, {
        name: 'nicolas',
        email: 'nicolaswyler@gmail.com',
        activationCode: '198212',
        link: 'http:localhost/veify?token=tokendeprueb',
      });
    }
    if (type === Emails.ResetPassword) {
      this.eventEmitter.emit(Emails.ResetPassword, {
        email: 'nicolaswyler@gmail.com',
      });
    }
  }

  async sendWhatsAppMessage() {
    this.eventEmitter.emit(WhatsApp.Test, {
      tempalteName: 'compulsa',
      providerName: 'Nest.js',
      userName: 'Nico',
      unitsCount: '500',
      product: 'fideos',
    });
  }
}

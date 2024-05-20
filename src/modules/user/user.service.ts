import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EncoderService } from '../auth/encoder.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Emails, ErrorMessages } from 'src/common/enum';
import { TypedEventEmitter } from '@/modules/event-emitter/typed-event-emitter.class';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WhatsApp } from '../../common/enum/email.enum';
import { Role } from '../../modules/role/role.entity';
import { Permission } from '../../modules/role/permission.entity';
import { Company } from '../../modules/company/company.entity';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private encoderService: EncoderService,
    private readonly eventEmitter: TypedEventEmitter,
    private jwtTokenService: JwtService,
    private _config: ConfigService,
  ) {}
  async createUser(
    createUserDto: CreateUserDto,
    company: Company,
    activationCode?: string,
  ) {
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
      company,
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

  async fetchUserRoles(userId: number): Promise<Role[]> {
    try {
      // Find the user by userId along with its associated roles
      const user = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.roles', 'role')
        .where('user.id = :userId', { userId })
        .getOne();

      // If user not found or user has no roles, return an empty array
      if (!user || !user.roles) {
        return [];
      }

      // Extract and return the roles associated with the user
      return user.roles;
    } catch (error) {
      // Handle errors (e.g., database query errors)
      console.error('Error fetching user roles:', error.message);
      throw error;
    }
  }

  async updateUserRolePermissions(
    userId: string,
    roleId: string,
    permissionIds: string[],
  ): Promise<User> {
    // Step 1: Retrieve the user from the database
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user) {
      throw new Error('User not found');
    }

    // Step 2: Find the role by ID
    const role = user.roles.find((userRole) => userRole.id === roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Step 3: Fetch the Permissions entities based on the permission IDs
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .whereInIds(permissionIds)
      .getMany();

    if (!permissions || permissions.length !== permissionIds.length) {
      throw new Error('Permissions not found');
    }

    // Step 4: Update the permissions for the role
    role.permissions = permissions;

    return this.userRepository.save(user);
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

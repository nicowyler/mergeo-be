import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EncoderService } from '../auth/encoder.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Emails, ErrorMessages } from 'src/common/enum';
import { TypedEventEmitter } from '../../modules/event-emitter/typed-event-emitter.class';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WhatsApp } from '../../common/enum/email.enum';
import { Permission } from '../../modules/role/permission.entity';
import { Company } from '../../modules/company/company.entity';
import { User } from './user.entity';
import { RoleService } from '../role/role.service';
import {
  CreateRoleDto,
  ResponseCreateRoleDto,
} from 'src/modules/role/dto/role.dto';
import { plainToInstance } from 'class-transformer';
import { CompanyService } from 'src/modules/company/company.service';
import { AddUserDto } from 'src/modules/auth/dto';
import { passwordGen } from 'src/common/utils';
import { Roles } from 'src/modules/role/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private readonly roleService: RoleService,
    private readonly companyService: CompanyService,
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
      return user;
    } catch (error) {
      if (error.code === '23505')
        throw new ConflictException(ErrorMessages.USER_EMAIL_EXISTS);
      else {
        throw new InternalServerErrorException();
      }
    }
  }

  async addNewUser(id: string, userDto: AddUserDto, company: Company) {
    const password = passwordGen(12);
    const hashedPassword = await this.encoderService.encodePassword(password);

    const owner = await this.userRepository.findOne({
      where: { id: id },
    });

    if (!owner) {
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);
    }

    try {
      const user = this.userRepository.create({
        ...userDto,
        company,
        password: hashedPassword,
        roles: userDto.roles,
      });

      await this.userRepository.save(user);

      this.eventEmitter.emit('user.invited', {
        email: userDto.email,
        owner: `${owner.firstName} ${owner.lastName}`,
        company: company.name,
        password: password,
      });
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

  async resendPasswordRecover(email: string, token: string) {
    const hashedToken = this.jwtTokenService.sign(
      { token },
      {
        secret: this._config.get('SECRET_PASSWORD_RESET'),
        expiresIn: this._config.get('SECRET_PASSWORD_RESET_EXPIRATION'),
      },
    );
    try {
      this.eventEmitter.emit(Emails.ResetPassword, {
        link: `${this._config.get(
          'USER_HOST',
        )}/passwordReset?token=${hashedToken}`,
        email: email,
      });
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${email}`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getUsers(companyId: string): Promise<User[]> {
    try {
      const users = await this.userRepository.find({
        where: { company: { id: companyId } },
        relations: ['roles', 'company', 'roles.permissions'],
      });

      return users;
    } catch (error) {
      console.log(error);
    }
  }

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user)
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['company', 'company.branches', 'company.branches.address'], // Adjusted relations to include branches and their addresses
    });

    if (!user) {
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${email}`);
    }

    return user; // Return the found user
  }

  async editUser(id: string, body: UpdateUserDto): Promise<User> {
    try {
      // Fetch user along with current roles
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ['roles'],
      });
      if (!user) {
        throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);
      }

      // Update user details
      Object.assign(user, body);

      if (body.roles) {
        // Fetch roles to be assigned
        const roles = await this.roleService.getRolesById(body.roles);

        // Update user roles
        user.roles = roles;
      }

      // Save updated user
      const updatedUser = await this.userRepository.save(user);

      return updatedUser;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async changePasword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      const user = await this.getUser(id);
      if (user?.password !== oldPassword) {
        throw new UnauthorizedException(
          "Old password and new one doesen't match",
        );
      }

      const hashedPassword = await this.encoderService.encodePassword(
        newPassword,
      );
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
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!user)
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);

    user.roles = [];

    this.userRepository.remove(user);

    return user;
  }

  // ROLES //
  async createUserRoles(
    userId: string,
    data: CreateRoleDto,
  ): Promise<ResponseCreateRoleDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${userId}`);
    }
    const company = await this.companyService.getCompanyByUserId(user);

    if (!user) {
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${userId}`);
    }

    const roleCreated = await this.roleService.createRole(
      company.id,
      user,
      data,
    );

    if (!roleCreated) {
      throw new InternalServerErrorException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { users: _, ...roleWithoutUser } = roleCreated;

    const response = plainToInstance(ResponseCreateRoleDto, {
      ...roleWithoutUser,
      companyId: company.id,
    });

    return response;
  }

  async addRolesToUser(
    userId: string,
    rolesId: Pick<Roles, 'id'>[],
  ): Promise<User> {
    // Fetch the user by their ID
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'], // Ensure the roles relation is loaded
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // Fetch the roles by their IDs
    const role = await this.roleService.getRolesById(rolesId);

    if (role.length !== rolesId.length) {
      throw new BadRequestException('Some roles not found');
    }

    // Add the roles to the user
    user.roles = [...user.roles, ...role];

    // Save the user entity to update the relationship in the database
    return await this.userRepository.save(user);
  }

  async deleteUserRole(id: string, roleId: string): Promise<User> {
    const user: User = await this.getUser(id);
    if (!user)
      throw new NotFoundException(`${ErrorMessages.USER_NOT_FOUND} ${id}`);

    const roleExists = user.roles.find((userRole) => userRole.id === roleId);
    if (!roleExists) {
      throw new NotFoundException(`${ErrorMessages.ROLE_NOT_FOUND} ${roleId}`);
    }
    user.roles = user.roles.filter((userRole) => userRole.id !== roleId);
    this.userRepository.save(user);
    return user;
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

    switch (emailType) {
      case Emails.VerifyEmail:
        this.eventEmitter.emit(Emails.VerifyEmail, {
          name: 'nicolas',
          email: 'nicolaswyler@gmail.com',
          activationCode: '198212',
          link: 'http:localhost/veify?token=tokendeprueb',
        });
        break;
      case Emails.ResetPassword:
        this.eventEmitter.emit(Emails.ResetPassword, {
          email: 'nicolaswyler@gmail.com',
        });
        break;
      case Emails.Invited:
        this.eventEmitter.emit(Emails.Invited, {
          email: 'fuegos12dejulio@gmail.com',
          owner: 'Nicolas Wyler',
          company: 'Fuegos 12 de Julio',
          password: '123456',
        });
        break;
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

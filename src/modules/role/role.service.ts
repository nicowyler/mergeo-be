import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '@/modules/role/role.entity';
import { Permission } from '@/modules/role/permission.entity';
import { UserService } from '../user/user.service';
import { CreateRoleDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { ResponseCreateRoleDto } from '@/modules/role/dto/createRole.dto';
import { ErrorMessages } from '@/common/enum';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    private userService: UserService,
  ) {}
  async createRole(
    createRoleDto: CreateRoleDto,
  ): Promise<ResponseCreateRoleDto> {
    try {
      const user = await this.userService.getUser(createRoleDto.userId);

      if (!user) {
        throw new NotFoundException(
          `User with id ${createRoleDto.userId} not found`,
        );
      }
      const role = new Role();
      role.name = createRoleDto.name;
      role.permissions = createRoleDto.permissions;
      role.createdBy = user;

      const roleCreated = await this.roleRepository.save(role);
      const response = plainToInstance(ResponseCreateRoleDto, {
        ...roleCreated,
        createdBy: user.id,
      });
      return response;
    } catch (error) {
      if (error.code === '23502') {
        throw new NotFoundException(
          `User with id ${createRoleDto.userId} not found`,
        );
      } else if (error.code === '23505') {
        throw new ConflictException(ErrorMessages.ROLE_NAME_TAKEN);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    return await this.roleRepository
      .createQueryBuilder('role')
      .innerJoin('role.createdBy', 'createdBy')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('createdBy.id = :userId', { userId: userId })
      .getMany();
  }

  async getPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.find();
  }
}

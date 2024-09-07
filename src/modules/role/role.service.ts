import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Roles } from '../../modules/role/role.entity';
import { Permission } from '../../modules/role/permission.entity';
import { CreateRoleDto } from './dto';
import { ErrorMessages } from '../../common/enum';
import { GetRoleDto, UpdateRoleDto } from 'src/modules/role/dto/role.dto';
import { User } from 'src/modules/user/user.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}
  async createRole(
    companyId: string,
    user: User,
    createRoleDto: CreateRoleDto,
  ): Promise<Roles> {
    try {
      const roles = new Roles();
      roles.name = createRoleDto.name;
      roles.permissions = createRoleDto.permissions;
      roles.companyId = companyId;
      if (user) roles.users = [user];

      const roleCreated = await this.roleRepository.save(roles);
      return roleCreated;
    } catch (error) {
      console.error('Error creating role:', error);
      if (error.code === '23502') {
        throw new NotFoundException(`User with id ${user.id} not found`);
      } else if (error.code === '23505') {
        throw new ConflictException(ErrorMessages.ROLE_NAME_TAKEN);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async createAdminRole(companyId: string, user: User) {
    const permissions = await this.permissionRepository.find();
    const adminRole = await this.roleRepository.findOne({
      where: { name: 'Admin', companyId: companyId },
    });
    if (adminRole) return adminRole;
    return this.createRole(companyId, user, {
      name: 'Admin',
      permissions: permissions,
    });
  }

  async createCompanyRole(companyId: string, createRoleDto: CreateRoleDto) {
    return this.createRole(companyId, null, {
      name: createRoleDto.name,
      permissions: createRoleDto.permissions,
    });
  }

  async getRoles(companyId: string): Promise<GetRoleDto> {
    const roles = await this.roleRepository.find({
      where: { companyId: companyId },
      relations: ['users', 'permissions'],
    });
    const allPermissions = await this.getPermissions();

    const updatedRoles = roles.map((role) => {
      const updatedPermissions = allPermissions.map((perm) => ({
        id: perm.id,
        name: perm.name,
        group: perm.group,
        action: perm.action,
        hasPermission: role.permissions.some((r) => r.name === perm.name),
      }));

      const { companyId, users, ...roleWithoutCompanyIdAndUser } = role;

      return {
        ...roleWithoutCompanyIdAndUser,
        permissions: updatedPermissions,
      };
    });

    return { companyId: companyId, roles: updatedRoles };
  }

  async getRolesById(roleIds: Pick<Roles, 'id'>[]): Promise<Roles[]> {
    const roles = await this.roleRepository.find({
      where: { id: In(roleIds) },
    });
    return roles;
  }

  async updateRole(id: string, body: UpdateRoleDto): Promise<Roles> {
    console.log(body);

    const role = await this.roleRepository.save({
      id: id,
      ...body,
    });
    return role;
  }

  async deleteRole(id: string): Promise<void> {
    const roles = await this.roleRepository.find({
      where: { id: id },
      relations: ['users'],
    });

    if (roles.length && roles[0].users.length) {
      throw new ConflictException(ErrorMessages.ROLE_HAS_USER);
    }

    const deleteResult = await this.roleRepository.delete({
      id: id,
    });

    if (deleteResult.affected === 0) {
      throw new NotFoundException(ErrorMessages.ROLE_NOT_FOUND, id);
    }
    return;
  }

  async getPermissions(): Promise<Permission[]> {
    return await this.permissionRepository.find();
  }
}

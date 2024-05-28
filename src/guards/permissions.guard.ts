// permissions.guard.ts
import { Permission } from '../modules/role/permission.entity';
import { Role } from '../modules/role/role.entity';
import { UserService } from '../modules/user/user.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    if (!requiredPermissions) {
      return true; // No permissions required, allow access
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming user is attached to the request
    if (!user) {
      return false; // User not authenticated or not found
    }

    // Fetch Role entities associated with the user
    const userRoles = await this.userService.getUser(user.sub);

    // Check if user's roles have the required permissions
    const isAuthorized = userRoles.role.some((role: Role) =>
      role.permissions.some((permission: Permission) =>
        requiredPermissions.includes(permission.name),
      ),
    );

    if (!isAuthorized) {
      throw new UnauthorizedException(
        'No tiene permisos para realizar esta accion',
      );
    } else {
      return true;
    }
  }
}

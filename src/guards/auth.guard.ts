import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { extractTokenFromHeader } from '@/common/utils/token.utils';
import { Reflector } from '@nestjs/core';
import { Role } from '@/common/enum';
import { checkRoles } from '@/common/utils';

@Injectable()
export class AuthGuard implements CanActivate {
  private payload;
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const roleName = this.reflector.get('role', context.getHandler()) || [
      Role.ADMIN,
      Role.PROVIDER,
    ];
    const token = extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Please provide token');
    }
    try {
      this.payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('SECRET'),
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = this.payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ForbiddenException(error, 'Token has expired');
      } else {
        throw new Error(error);
      }
    }

    checkRoles(this.payload);
    return true;
  }
}

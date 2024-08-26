import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncoderService } from '../auth/encoder.service';
import { TypedEventEmitterModule } from '../../modules/event-emitter/typed-event-emitter.module';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Permission } from '../../modules/role/permission.entity';
import { Roles } from '../../modules/role/role.entity';
import { User } from '../../modules/user/user.entity';
import { RoleService } from '../../modules/role/role.service';
import { RoleController } from 'src/modules/role/role.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Roles, Permission]),
    TypedEventEmitterModule,
    PassportModule,
  ],
  controllers: [RoleController],
  providers: [RoleService, EncoderService, JwtService, AuthGuard],
})
export class RoleModule {}

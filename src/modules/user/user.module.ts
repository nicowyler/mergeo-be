import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncoderService } from '../auth/encoder.service';
import { TypedEventEmitterModule } from '../../modules/event-emitter/typed-event-emitter.module';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Permission } from '../../modules/role/permission.entity';
import { Roles } from '../../modules/role/role.entity';
import { Address, Company } from '../../modules/company/company.entity';
import { Branch } from '../../modules/company/branch.entity';
import { CompanyService } from '../company/company.service';
import { RoleService } from 'src/modules/role/role.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Roles,
      Permission,
      Company,
      Branch,
      Address,
    ]),
    TypedEventEmitterModule,
    PassportModule,
  ],
  controllers: [UserController],
  providers: [
    RoleService,
    UserService,
    CompanyService,
    EncoderService,
    JwtService,
    AuthGuard,
  ],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthProvider } from './auth.provider';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service';
import { EncoderService } from './encoder.service';
import { TypedEventEmitter } from '../../modules/event-emitter/typed-event-emitter.class';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Permission } from '../../modules/role/permission.entity';
import { Branch } from '../company/entities/branch.entity';
import { RoleService } from 'src/modules/role/role.service';
import { Roles } from 'src/modules/role/role.entity';
import { HttpModule } from '@nestjs/axios';
import { Company } from 'src/modules/company/entities/company.entity';
import { Address } from 'src/modules/company/entities/address.entity';
import { ClientBlackList } from 'src/modules/company/entities/client-black-list.entity';
import { CompanyService } from 'src/modules/company/services/company.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Company,
      Branch,
      Permission,
      Roles,
      Address,
      ClientBlackList,
    ]),
    AuthProvider,
    HttpModule,
  ],
  providers: [
    AuthService,
    EncoderService,
    TypedEventEmitter,
    UserService,
    RoleService,
    CompanyService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

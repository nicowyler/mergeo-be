import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Address, Company } from './company.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncoderService } from '../auth/encoder.service';
import { TypedEventEmitterModule } from '../../modules/event-emitter/typed-event-emitter.module';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Branch } from '../../modules/company/branch.entity';
import { Role } from '../../modules/role/role.entity';
import { User } from '../../modules/user/user.entity';
import { CompanyController } from '../../modules/company/company.controller';
import { UserService } from '../../modules/user/user.service';
import { Permission } from '../../modules/role/permission.entity';
import { RoleService } from 'src/modules/role/role.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Company,
      Branch,
      Permission,
      Address,
    ]),
    TypedEventEmitterModule,
    PassportModule,
  ],
  controllers: [CompanyController],
  providers: [
    CompanyService,
    UserService,
    RoleService,
    EncoderService,
    JwtService,
    AuthGuard,
  ],
})
export class CompanyModule {}

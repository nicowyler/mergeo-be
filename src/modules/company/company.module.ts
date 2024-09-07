import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './company.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncoderService } from '../auth/encoder.service';
import { TypedEventEmitterModule } from '../../modules/event-emitter/typed-event-emitter.module';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Branch } from '../../modules/company/branch.entity';
import { Roles } from '../../modules/role/role.entity';
import { User } from '../../modules/user/user.entity';
import { CompanyController } from '../../modules/company/company.controller';
import { UserService } from '../../modules/user/user.service';
import { Permission } from '../../modules/role/permission.entity';
import { RoleService } from 'src/modules/role/role.service';
import { PickUpPointController } from 'src/modules/company/pickUpPoints/pickUpPoint.controller';
import { PickUpPointService } from 'src/modules/company/pickUpPoints/pickUpPoint.service';
import { Address } from 'src/modules/company/address.entity';
import { PickUpPoint } from 'src/modules/company/pickUpPoints/pickUpPoint.entity';
import { PickUpSchedule } from 'src/modules/company/pickUpPoints/pickUpSchedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Roles,
      Company,
      Branch,
      Permission,
      Address,
      PickUpPoint,
      PickUpSchedule,
    ]),
    TypedEventEmitterModule,
    PassportModule,
  ],
  controllers: [CompanyController, PickUpPointController],
  providers: [
    CompanyService,
    PickUpPointService,
    UserService,
    RoleService,
    EncoderService,
    JwtService,
    AuthGuard,
  ],
})
export class CompanyModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncoderService } from '../auth/encoder.service';
import { TypedEventEmitterModule } from '../../modules/event-emitter/typed-event-emitter.module';
import { PassportModule } from '@nestjs/passport';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Branch } from './entities/branch.entity';
import { Roles } from '../../modules/role/role.entity';
import { User } from '../../modules/user/user.entity';
import { CompanyController } from '../../modules/company/company.controller';
import { UserService } from '../../modules/user/user.service';
import { Permission } from '../../modules/role/permission.entity';
import { RoleService } from 'src/modules/role/role.service';
import { PickUpPointController } from 'src/modules/company/pickUpPoints/pickUpPoint.controller';
import { PickUpPointService } from 'src/modules/company/pickUpPoints/pickUpPoint.service';
import { PickUpPoint } from 'src/modules/company/pickUpPoints/pickUpPoint.entity';
import { PickUpSchedule } from 'src/modules/company/pickUpPoints/pickUpSchedule.entity';
import { DropZoneSchedule } from 'src/modules/company/dropZones/dropZoneSchedule.entity';
import { DropZone } from 'src/modules/company/dropZones/dropZone.entity';
import { DropZoneController } from 'src/modules/company/dropZones/dropZone.controller';
import { DropZoneService } from 'src/modules/company/dropZones/dropZone.service';
import { Company } from 'src/modules/company/entities/company.entity';
import { Address } from 'src/modules/company/entities/address.entity';
import { ClientBlackList } from 'src/modules/company/entities/client-black-list.entity';
import { CompanyService } from 'src/modules/company/services/company.service';
import { BranchService } from 'src/modules/company/services/branches.service';
import { BlackListService } from 'src/modules/product/services/blacklist.service';
import { BlackList } from 'src/modules/product/entities/black-list.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { FavoritesService } from 'src/modules/product/services/favorits.service';
import { FavoriteList } from 'src/modules/product/entities/favorite-list.entity';
import { ClientBlackListService } from 'src/modules/company/services/blackList.service';

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
      DropZone,
      DropZoneSchedule,
      ClientBlackList,
      Product,
      BlackList,
      ClientBlackList,
      FavoriteList,
    ]),
    TypedEventEmitterModule,
    PassportModule,
  ],
  controllers: [CompanyController, PickUpPointController, DropZoneController],
  providers: [
    CompanyService,
    ClientBlackListService,
    BlackListService,
    FavoritesService,
    BranchService,
    PickUpPointService,
    DropZoneService,
    UserService,
    RoleService,
    EncoderService,
    JwtService,
    AuthGuard,
  ],
})
export class CompanyModule {}

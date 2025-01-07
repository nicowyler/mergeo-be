import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { PreOrderController } from './pre-order.controller';
import { PreOrderService } from './pre-order.service';
import { PreOrderProcessor } from './pre-order.processor';
import { CompanyService } from 'src/modules/company/company.service';
import { PreOrder } from 'src/modules/pre-order/entities/pre-order.entity';
import { Company } from 'src/modules/company/company.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { User } from 'src/modules/user/user.entity';
import { UserService } from 'src/modules/user/user.service';
import { ProductService } from 'src/modules/product/product.service';
import { Branch } from 'src/modules/company/branch.entity';
import { Address } from 'src/modules/company/address.entity';
import { Permission } from 'src/modules/role/permission.entity';
import { Roles } from 'src/modules/role/role.entity';
import { RoleService } from 'src/modules/role/role.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EncoderService } from 'src/modules/auth/encoder.service';
import { PreOrderProduct } from 'src/modules/pre-order/entities/pre-order-product.entity';
import { PreOrderCriteria } from 'src/modules/pre-order/entities/pre-order-criterias.entity';
import { BuyOrderService } from 'src/modules/buy-order/buy-order.service';
import { BuyOrder } from 'src/modules/buy-order/entities/buy-order.entity';
import { BuyOrderModule } from 'src/modules/buy-order/buy-order.module';
import { BuyOrderProduct } from 'src/modules/buy-order/entities/buy-order-product.entity';
import { ProductList } from 'src/modules/product/entities/productList.entity';
import { ProductModule } from 'src/modules/product/product.module';

@Module({
  imports: [
    BuyOrderModule,
    ProductModule,
    TypeOrmModule.forFeature([
      PreOrder,
      PreOrderProduct,
      PreOrderCriteria,
      Company,
      Product,
      ProductList,
      User,
      Branch,
      Address,
      Permission,
      Roles,
      BuyOrder,
      BuyOrderProduct,
    ]),
    BullModule.registerQueue({
      name: 'preorder', // Queue name for pre-order jobs
    }),
  ],
  controllers: [PreOrderController],
  providers: [
    PreOrderService,
    PreOrderProcessor,
    BuyOrderService,
    CompanyService,
    UserService,
    RoleService,
    JwtService,
    ConfigService,
    EncoderService,
  ],
})
export class PreOrderModule {}

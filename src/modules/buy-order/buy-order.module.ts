import { Module } from '@nestjs/common';
import { BuyOrderService } from './buy-order.service';
import { BuyOrderController } from './buy-order.controller';
import { PreOrder } from 'src/modules/pre-order/entities/pre-order.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreOrderProduct } from 'src/modules/pre-order/entities/pre-order-product.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { User } from 'src/modules/user/user.entity';
import { BuyOrder } from 'src/modules/buy-order/entities/buy-order.entity';
import { BuyOrderProduct } from 'src/modules/buy-order/entities/buy-order-product.entity';
import { Branch } from 'src/modules/company/entities/branch.entity';
import { Company } from 'src/modules/company/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BuyOrder,
      BuyOrderProduct,
      PreOrder,
      PreOrderProduct,
      Company,
      Branch,
      Product,
      User,
    ]),
  ],
  controllers: [BuyOrderController],
  providers: [BuyOrderService],
  exports: [BuyOrderService], // Export if you need to use it in other modules
})
export class BuyOrderModule {}

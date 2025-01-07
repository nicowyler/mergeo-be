import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/user.entity';
import { Address } from 'src/modules/company/address.entity';
import { Branch } from 'src/modules/company/branch.entity';
import { Company } from 'src/modules/company/company.entity';
import { Product } from './entities/product.entity';
import { ProductList } from 'src/modules/product/entities/productList.entity';
import { MockProductsService } from './mock-products.service';
import { BullModule } from '@nestjs/bull';
import { ProductQueueService } from 'src/modules/product/product.queue';
import { ProductMapper } from 'src/modules/product/productMapper';
import { ProductProcessor } from 'src/modules/product/product-upload.processor';
import { Gs1Module } from 'src/modules/gs1/gs1.module';
import { UnitService } from 'src/modules/product/unitsMapper.service';
import { Unit } from 'src/modules/product/entities/unit.entity';

@Module({
  imports: [
    Gs1Module,
    TypeOrmModule.forFeature([
      Product,
      Unit,
      ProductList,
      User,
      Company,
      Branch,
      Address,
    ]),
    BullModule.registerQueue({
      name: 'products',
    }),
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    MockProductsService,
    ProductQueueService,
    ProductMapper,
    ProductProcessor,
    UnitService,
  ],
  exports: [ProductService, MockProductsService],
})
export class ProductModule {}

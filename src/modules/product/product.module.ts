import { Module } from '@nestjs/common';
import { ProductService } from './services/product.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/user.entity';
import { Branch } from 'src/modules/company/entities/branch.entity';
import { Product } from './entities/product.entity';
import { ProductList } from 'src/modules/product/entities/product-list.entity';
import { BullModule } from '@nestjs/bull';
import { ProductQueueService } from 'src/modules/product/queue/product.queue';
import { ProductMapper } from 'src/modules/product/queue/productMapper';
import { ProductProcessor } from 'src/modules/product/queue/product-upload.processor';
import { Gs1Module } from 'src/modules/gs1/gs1.module';
import { UnitService } from 'src/modules/product/services/unitsMapper.service';
import { Unit } from 'src/modules/product/entities/unit.entity';
import { FavoriteList } from 'src/modules/product/entities/favorite-list.entity';
import { BlackList } from 'src/modules/product/entities/black-list.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { Address } from 'src/modules/company/entities/address.entity';
import { ClientBlackList } from 'src/modules/company/entities/client-black-list.entity';
import { FavoritesService } from 'src/modules/product/services/favorits.service';
import { BlackListService } from 'src/modules/product/services/blacklist.service';
import { DiscountsListService } from 'src/modules/product/services/discountsLists.service';
import { ProductController } from 'src/modules/product/controllers/product.controller copy';
import { DiscountListsController } from 'src/modules/product/controllers/discountLists.controller';
import { FavoriteListController } from 'src/modules/product/controllers/favoriteList.controller';
import { BlackListController } from 'src/modules/product/controllers/blackList.controller';

@Module({
  imports: [
    Gs1Module,
    TypeOrmModule.forFeature([
      Product,
      ProductList,
      FavoriteList,
      BlackList,
      Unit,
      User,
      Company,
      Branch,
      Address,
      ClientBlackList,
    ]),
    BullModule.registerQueue({
      name: 'products',
    }),
  ],
  controllers: [
    ProductController,
    DiscountListsController,
    FavoriteListController,
    BlackListController,
  ],
  providers: [
    ProductService,
    DiscountsListService,
    FavoritesService,
    BlackListService,
    ProductQueueService,
    ProductMapper,
    ProductProcessor,
    UnitService,
  ],
  exports: [ProductService],
})
export class ProductModule {}

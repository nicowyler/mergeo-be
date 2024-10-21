import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/user.entity';
import { Address } from 'src/modules/company/address.entity';
import { Branch } from 'src/modules/company/branch.entity';
import { Company } from 'src/modules/company/company.entity';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, User, Company, Branch, Address]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}

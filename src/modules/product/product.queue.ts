import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { GtinProductDto } from 'src/modules/product/dto/gtinProduct.dto';
import { UUID } from 'crypto';
import { name } from 'ejs';

export type ProductQueueType = {
  products: GtinProductDto[];
  companyId: UUID;
  listId: UUID | null;
};

export type ProductQueueJobType = {
  gtin: string;
  price: number;
  companyId: UUID;
  listId: UUID | null;
  upload_percent: number;
};

@Injectable()
export class ProductQueueService {
  constructor(@InjectQueue('products') private readonly productQueue: Queue) {}

  async addProductsToQueue(params: ProductQueueType) {
    const { products, companyId, listId } = params;
    await this.productQueue.addBulk(
      products.map((product: GtinProductDto, index: number) => ({
        name: 'products-upload',
        data: {
          upload_percent: Math.round(((index + 1) / products.length) * 100),
          gtin: product.gtin,
          price: product.price,
          companyId: companyId,
          listId: listId,
        },
      })),
    );
  }
}

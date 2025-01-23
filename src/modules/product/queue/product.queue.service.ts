import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { GtinProductDto } from 'src/modules/product/dto/gtinProduct.dto';
import { UUID } from 'crypto';

export type ProductQueueType = {
  products: GtinProductDto[];
  companyId: UUID;
};

export type ProductQueueJobType = {
  gtin: string;
  price: number;
  companyId: UUID;
  upload_percent: number;
};

@Injectable()
export class ProductQueueService {
  constructor(@InjectQueue('products') private readonly productQueue: Queue) {}

  /**
   * Adds a list of products to the queue for processing.
   *
   * @param {ProductQueueType} params - The parameters for adding products to the queue.
   * @param {GtinProductDto[]} params.products - The list of products to be added to the queue.
   * @param {string} params.companyId - The ID of the company to which the products belong.
   * @returns {Promise<void>} A promise that resolves when the products have been added to the queue.
   */
  async addProductsToQueue(params: ProductQueueType) {
    const { products, companyId } = params;
    await this.productQueue.addBulk(
      products.map((product: GtinProductDto, index: number) => ({
        name: 'products-upload',
        data: {
          upload_percent: Math.round(((index + 1) / products.length) * 100),
          gtin: product.gtin,
          price: product.price,
          companyId: companyId,
        },
      })),
    );
  }
}

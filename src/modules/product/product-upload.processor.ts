import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { ProductService } from './product.service';
import { Gs1Service } from 'src/modules/gs1/gs1.service';
import { ProductQueueJobType } from 'src/modules/product/product.queue';

@Injectable()
@Processor('products')
export class ProductProcessor {
  constructor(
    private readonly gs1Service: Gs1Service,
    private readonly productService: ProductService,
  ) {}

  @Process('products-upload')
  async handleProductJob(job: Job<ProductQueueJobType>) {
    const { gtin, price, companyId, listId } = job.data;
    try {
      const productData = await this.gs1Service.getProductByGTIN(gtin);
      productData.price = price;
      await this.productService.addProduct(productData, companyId, listId);

      console.log(`Product with GTIN ${gtin} saved successfully.`);
    } catch (error) {
      console.error(`Error processing GTIN ${gtin}:`, error);
    }
  }
}

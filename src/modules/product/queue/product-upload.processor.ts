import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { Gs1Service } from 'src/modules/gs1/gs1.service';
import { ProductQueueJobType } from 'src/modules/product/queue/product.queue.service';
import { TypedEventEmitter } from 'src/modules/event-emitter/typed-event-emitter.class';
import {
  SERVER_SENT_EVENT,
  SERVER_SENT_EVENTS,
} from 'src/common/enum/serverSentEvents.enum';
import { UUID } from 'crypto';
import { Gs1ProductDto } from 'src/modules/product/dto/gs1-product.dto';
import { Product } from 'src/modules/product/entities/product.entity';

@Injectable()
@Processor('products')
export class ProductProcessor {
  private readonly logger = new Logger(ProductProcessor.name);

  constructor(
    private readonly gs1Service: Gs1Service,
    private readonly productService: ProductService,
    private readonly eventEmitter: TypedEventEmitter,
  ) {}

  /**
   * Handles the event when a product changes.
   *
   * @param gtin - The Global Trade Item Number (GTIN) of the product.
   * @param providerId - The unique identifier of the provider.
   * @param upload_percent - The percentage of the upload completed.
   *
   * Emits a server-sent event with the provided information and logs the event.
   */
  async onProductChange(
    gtin: string,
    providerId: UUID,
    upload_percent: number,
  ) {
    this.eventEmitter.emit(SERVER_SENT_EVENT, {
      gtin,
      providerId,
      upload_percent,
      message: SERVER_SENT_EVENTS.productsUploadSuccess,
    });
    this.logger.log(`Product with ${gtin}, uploaded to client ${providerId}`);
  }

  @Process('products-upload')
  async handleProductJob(job: Job<ProductQueueJobType>) {
    const { gtin, price, companyId, userId, fileName, upload_percent } =
      job.data;
    try {
      if (!gtin) {
        return;
      }
      // we check if the product already exists in our database if not we go to GS1
      let productData: Gs1ProductDto | Product =
        await this.productService.getProductLocallyByGTIN(gtin);
      if (!productData) {
        productData = await this.gs1Service.getProductByGTIN(gtin);
      }
      if (productData instanceof Product) {
        productData.price = price;
      } else {
        productData = {
          ...productData,
          price: price,
        } as Gs1ProductDto;
      }
      this.onProductChange(gtin, companyId, upload_percent); // Emit the event
      await this.productService.addProduct(
        productData,
        userId,
        companyId,
        fileName,
      );
    } catch (error) {
      this.onProductChange(gtin, companyId, upload_percent); // Emit the event
      console.error(`Error processing GTIN ${gtin}:`, error);
    }
  }
}

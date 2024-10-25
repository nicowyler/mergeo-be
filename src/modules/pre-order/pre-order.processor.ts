import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { PreOrderService } from './pre-order.service';
import { UUID } from 'crypto';
import { CartProductDto } from 'src/modules/pre-order/dto/create-pre-order.dto';

@Processor('preorder')
export class PreOrderProcessor {
  constructor(private readonly preOrderService: PreOrderService) {}

  @Process('process-preorder')
  async handlePreOrder(job: Job) {
    const {
      preOrderId,
      acceptedProducts,
      rejectedProducts,
      instance, // this is a count of the times the product has been pre-ordered
    } = job.data;

    // Handle the provider's response
    await this.preOrderService.handleProviderResponse(
      preOrderId,
      acceptedProducts,
      rejectedProducts,
      'provider-response',
      instance,
    );
  }

  @Process('preorder-timeout')
  async handleTimeout(job: Job) {
    const { preOrderId, instance } = job.data;

    // Handle timeout if provider didn't respond
    await this.preOrderService.handleProviderResponse(
      preOrderId,
      [],
      [],
      'timeout',
      instance,
    );
  }

  // Simulated provider response (for testing)
  async simulateProviderResponse(preOrderId: UUID): Promise<{
    acceptedProducts: CartProductDto[];
    rejectedProducts: CartProductDto[];
  }> {
    // Simulate partial acceptance by the provider
    return {
      acceptedProducts: [
        /* List of accepted product IDs */
        {
          id: '5cce60f2-79de-4a68-973f-bdeed73577e8',
          quantity: 10,
          providerId: 'f6a1af5b-3d36-4fd5-9fdb-df1c2e41dce2',
        },
        {
          id: '5233598f-76b4-479b-8c70-3ce17d1dd3bc',
          quantity: 2,
          providerId: 'f6a1af5b-3d36-4fd5-9fdb-df1c2e41dce2',
        },
      ],
      rejectedProducts: [
        /* List of rejected product IDs */
        {
          id: 'c2140347-c887-45d7-9673-ed460601ec58',
          quantity: 2,
          providerId: 'f6a1af5b-3d36-4fd5-9fdb-df1c2e41dce2',
        },
      ],
    };
  }
}

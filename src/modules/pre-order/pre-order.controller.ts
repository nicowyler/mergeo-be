import { Controller, Post, Body, Param } from '@nestjs/common';
import { PreOrderService } from './pre-order.service';
import {
  CreatePreOrderDto,
  ProcessProviderResponseDto,
} from './dto/create-pre-order.dto';
import { UUID } from 'crypto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('preorder')
export class PreOrderController {
  constructor(
    private readonly preOrderService: PreOrderService,
    @InjectQueue('preorder') private readonly preorderQueue: Queue,
  ) {}

  @Post('/:userId')
  async createPreOrder(
    @Param('userId') userId: UUID,
    @Body() preOrderBody: CreatePreOrderDto,
  ) {
    return this.preOrderService.createPreOrders(preOrderBody, userId, 0);
  }

  @Post('/:preOrderId/provider-response')
  async handleProviderResponse(
    @Param('preOrderId') preOrderId: UUID,
    @Body() providerResponse: ProcessProviderResponseDto,
  ) {
    const { acceptedProducts, rejectedProducts } = providerResponse;

    // Add the provider's response to the queue (process-preorder)
    await this.preorderQueue.add('process-preorder', {
      preOrderId,
      acceptedProducts,
      rejectedProducts,
    });

    return { message: 'Response received and is being processed.' };
  }
}

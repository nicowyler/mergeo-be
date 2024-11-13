import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { PreOrderService } from './pre-order.service';
import {
  CreatePreOrderDto,
  ProcessProviderResponseDto,
} from './dto/create-pre-order.dto';
import { UUID } from 'crypto';
import { PreOrderProcessor } from 'src/modules/pre-order/pre-order.processor';
import { PRE_ORDER_STATUS } from 'src/common/enum/preOrder.enum';

@Controller('preorder')
export class PreOrderController {
  constructor(
    private readonly preOrderService: PreOrderService,
    private readonly preOrderQueue: PreOrderProcessor,
  ) {}

  @Post('/:userId')
  async createPreOrder(
    @Param('userId') userId: UUID,
    @Body() preOrderBody: CreatePreOrderDto,
  ) {
    return this.preOrderService.createPreOrders(preOrderBody, userId);
  }

  @Post('/:preOrderId/provider-response')
  async providerResponse(
    @Param('preOrderId') preOrderId: UUID,
    @Body() providerResponse: ProcessProviderResponseDto,
  ) {
    const { acceptedProducts, rejectedProducts } = providerResponse;

    // Add the provider's response to the queue (process-preorder)
    await this.preOrderQueue.updatePreOrderJob(preOrderId, {
      acceptedProducts,
      rejectedProducts,
    });

    return { message: 'Response received and is being processed.' };
  }

  @Post('/:preOrderId/status')
  async checkJobStatus(@Param('preOrderId') preOrderId: string) {
    const job = await this.preOrderQueue.getPreOrderJob(preOrderId);
    return job;
  }

  @Post('/clear/all')
  async removeAllJobs() {
    return this.preOrderQueue.clearAllJobs();
  }

  @Get()
  async getAllActivePreOrderJobs() {
    return this.preOrderQueue.getAllActivePreOrderJobs();
  }

  @Get('/:companyId')
  async get(
    @Param('companyId') companyId: UUID,
    @Query('status') status: PRE_ORDER_STATUS,
  ) {
    return this.preOrderService.findProrderByStatus(companyId, status);
  }
}

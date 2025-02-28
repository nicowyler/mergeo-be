import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PreOrderService } from './pre-order.service';
import {
  CreatePreOrderDto,
  ProcessProviderResponseDto,
} from './dto/create-pre-order.dto';
import { UUID } from 'crypto';
import { PreOrderProcessor } from 'src/modules/pre-order/pre-order.processor';
import { PRE_ORDER_STATUS } from 'src/common/enum/preOrder.enum';
import { AuthGuard } from 'src/guards';
import { TransformInterceptor } from 'src/interceptors/response.interceptor';

@Controller('preorder')
@UseInterceptors(TransformInterceptor)
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

  @UseGuards(AuthGuard)
  @Post('/:preOrderId/provider-response')
  async providerResponse(
    @Param('preOrderId') preOrderId: UUID,
    @Body() providerResponse: ProcessProviderResponseDto,
    @Request() req,
  ) {
    const userId = req.user?.id;
    const { acceptedProducts, rejectedProducts } = providerResponse;

    // Add the provider's response to the queue (process-preorder)
    await this.preOrderQueue.updatePreOrderJob(preOrderId, userId, {
      acceptedProducts,
      rejectedProducts,
    });

    return { message: 'Response received and is being processed.' };
  }

  @Get('/:preOrderId')
  async getPreOrderById(@Param('preOrderId') preOrderId: UUID) {
    return await this.preOrderService.getPreOrderByid(preOrderId);
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

  @Get('/:companyId/client')
  async get(
    @Param('companyId') companyId: UUID,
    @Query('status') status: PRE_ORDER_STATUS,
  ) {
    return this.preOrderService.findProrderByStatus(companyId, status);
  }

  @Get('/:companyId/provider')
  async getSellPreorders(
    @Param('companyId') companyId: UUID,
    @Query('status') status: PRE_ORDER_STATUS,
  ) {
    return this.preOrderService.findSellPreOrders(companyId, status);
  }
}

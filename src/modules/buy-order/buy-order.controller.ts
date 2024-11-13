import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { BuyOrderService } from './buy-order.service';
import { CreateBuyOrderDto } from './dto/create-buy-order.dto';
import { UUID } from 'crypto';
import { ResponseMessage } from 'src/decorators/response_message.decorator';
import { TransformInterceptor } from 'src/interceptors/response.interceptor';

@Controller('buy-order')
@UseInterceptors(TransformInterceptor)
export class BuyOrderController {
  constructor(private readonly buyOrderService: BuyOrderService) {}

  @Post()
  create(@Body() createBuyOrderDto: CreateBuyOrderDto) {
    return this.buyOrderService.createOrder(createBuyOrderDto);
  }

  @Get(':id')
  @ResponseMessage('Ordenes de compra encontradas con exito!')
  findAll(@Param('id') clientId: UUID) {
    return this.buyOrderService.findAll(clientId);
  }
}

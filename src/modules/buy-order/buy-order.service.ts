import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBuyOrderDto } from './dto/create-buy-order.dto';
import { BuyOrder } from 'src/modules/buy-order/entities/buy-order.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/modules/product/entities/product.entity';
import { BuyOrderProduct } from 'src/modules/buy-order/entities/buy-order-product.entity';
import { UUID } from 'crypto';
import { Branch } from 'src/modules/company/branch.entity';
import {
  SERVER_SENT_EVENT,
  SERVER_SENT_EVENTS,
} from 'src/common/enum/serverSentEvents.enum';
import { TypedEventEmitter } from 'src/modules/event-emitter/typed-event-emitter.class';

export type OrderStatusUpdate = {
  orderId: string; // UUID of the order
  clientId: string; // UUID of the client
  message: string; // Status message (e.g., "Order Created")
};

@Injectable()
export class BuyOrderService {
  constructor(
    @InjectRepository(BuyOrder)
    private readonly buyOrderRepository: Repository<BuyOrder>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(BuyOrderProduct)
    private readonly buyOrderProductRepository: Repository<BuyOrderProduct>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly eventEmitter: TypedEventEmitter,
  ) {}

  // Method to notify order status change
  private async notifyOrderStatusChange(
    orderId: UUID,
    clientId: UUID,
    providerId: UUID,
  ) {
    if (!clientId) {
      throw new Error('clientId is required for notifyOrderStatusChange');
    }

    this.eventEmitter.emit(SERVER_SENT_EVENT, {
      orderId,
      clientId,
      providerId,
      message: SERVER_SENT_EVENTS.orderCreated,
    });

    console.log('Emitting update');
  }

  async createOrder(createBuyOrderDto: CreateBuyOrderDto) {
    const { preOrder, acceptedProducts, client, provider } = createBuyOrderDto;

    if (!client || !provider || !preOrder) {
      throw new BadRequestException('Client, provider, or pre-order not found');
    }
    // Create BuyOrder with related entities
    const buyOrder = this.buyOrderRepository.create({
      client,
      provider,
      preOrder,
    });

    await this.buyOrderRepository.save(buyOrder);

    // Fetch product entities for each accepted product
    const productIds = acceptedProducts.map((product) => product.id); // Extract product IDs
    const products = await this.productRepository.findBy({
      id: In(productIds),
    }); // Adjust this based on your repository setup

    // Map to buyOrderProducts with product entity references
    const buyOrderProducts = acceptedProducts.map((acceptedProduct) => {
      const productEntity = products.find(
        (product) => product.id === acceptedProduct.id,
      );
      if (!productEntity) {
        throw new BadRequestException(
          `Product with ID ${acceptedProduct.id} not found`,
        );
      }
      return {
        buyOrder, // reference the saved BuyOrder
        product: productEntity, // Use the product entity here
        quantity: acceptedProduct.quantity,
      };
    });

    // Use bulk insert for buyOrderProducts
    await this.buyOrderProductRepository.save(buyOrderProducts);

    // Notify order status change
    await this.notifyOrderStatusChange(buyOrder.id, client.id, provider.id);

    return buyOrder;
  }

  async findAll(clientId: UUID) {
    // Step 1: Fetch BuyOrders with related entities
    const buyOrders = await this.buyOrderRepository.find({
      where: { client: { id: clientId } },
      relations: [
        'client',
        'provider',
        'preOrder',
        'buyOrderProducts',
        'buyOrderProducts.product',
      ],
    });

    // Step 2: Extract branch information from criteria
    const branchPromises = buyOrders.map(async (order) => {
      const branchId = order.preOrder.criteria.branchId; // Get branchId from criteria
      const schedule = {
        startDay: order.preOrder.criteria.expectedDeliveryStartDay,
        endDay: order.preOrder.criteria.expectedDeliveryEndDay,
        startHour: order.preOrder.criteria.startHour,
        endHour: order.preOrder.criteria.endHour,
      }; // Get deadline from criteria

      const branch = await this.branchRepository.findOne({
        where: { id: branchId },
        relations: ['address'],
      }); // Fetch branch

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { preOrder, ...orderWithoutPreOrder } = order;

      return {
        ...orderWithoutPreOrder,
        branch: branch ? { id: branch.id, address: branch.address } : null, // Include branch info
        schedule: schedule,
      };
    });

    // Wait for all branch information to be fetched
    // Wait for all branch information to be fetched and sort by the updated date
    const sortedOrders = (await Promise.all(branchPromises)).sort((a, b) => {
      return new Date(b.updated).getTime() - new Date(a.updated).getTime();
    });

    return sortedOrders;
  }

  findOne(id: number) {
    return `This action returns a #${id} buyOrder`;
  }

  remove(id: number) {
    return `This action removes a #${id} buyOrder`;
  }
}

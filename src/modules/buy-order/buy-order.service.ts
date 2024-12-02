import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBuyOrderDto } from './dto/create-buy-order.dto';
import { BuyOrder } from 'src/modules/buy-order/entities/buy-order.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BuyOrderProduct } from 'src/modules/buy-order/entities/buy-order-product.entity';
import { UUID } from 'crypto';
import { Branch } from 'src/modules/company/branch.entity';
import {
  SERVER_SENT_EVENT,
  SERVER_SENT_EVENTS,
} from 'src/common/enum/serverSentEvents.enum';
import { TypedEventEmitter } from 'src/modules/event-emitter/typed-event-emitter.class';
import { PreOrderProduct } from 'src/modules/pre-order/entities/pre-order-product.entity';
import { User } from 'src/modules/user/user.entity';
import { plainToInstance } from 'class-transformer';
import {
  AddressDto,
  OrderDto,
  UserDto,
} from 'src/modules/buy-order/dto/find-buy-order.dto';

export type OrderStatusUpdate = {
  orderId: string; // UUID of the order
  clientId: string; // UUID of the client
  providerId: string; // UUID of the provider
  message: string; // Status message (e.g., "Order Created")
};

@Injectable()
export class BuyOrderService {
  constructor(
    @InjectRepository(BuyOrder)
    private readonly buyOrderRepository: Repository<BuyOrder>,
    @InjectRepository(PreOrderProduct)
    private readonly preOrderProductRepository: Repository<PreOrderProduct>,
    @InjectRepository(BuyOrderProduct)
    private readonly buyOrderProductRepository: Repository<BuyOrderProduct>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    const { preOrder, acceptedProducts, client, provider, userId } =
      createBuyOrderDto;

    if (!client || !provider || !preOrder) {
      throw new BadRequestException('Client, provider, or pre-order not found');
    }

    // Create BuyOrder with related entities
    const buyOrder = this.buyOrderRepository.create({
      userId,
      client,
      provider,
      preOrder,
    });

    await this.buyOrderRepository.save(buyOrder);

    // Fetch product entities for each accepted product
    const productIds = acceptedProducts.map((product) => product.id); // Extract product IDs
    const preOrderProducts = await this.preOrderProductRepository.find({
      where: {
        id: In(productIds),
      },
      relations: ['product'],
    });

    // Map to buyOrderProducts with product entity references
    const buyOrderProducts = preOrderProducts.map((preOrderProduct) => {
      try {
        return {
          buyOrder, // reference the saved BuyOrder
          product: preOrderProduct.product, // Use the product entity here
          quantity: preOrderProduct.quantity,
        };
      } catch (error) {
        throw new NotFoundException(error.message);
      }
    });

    // Use bulk insert for buyOrderProducts
    await this.buyOrderProductRepository.save(buyOrderProducts);

    // Notify order status change
    await this.notifyOrderStatusChange(buyOrder.id, client.id, provider.id);

    return buyOrder;
  }

  async findBuyOrders(id: UUID, isClient = true) {
    // Step 1: Fetch BuyOrders with related entities
    const whereCondition = isClient
      ? { client: { id } } // Search by client ID
      : { provider: { id } }; // Search by provider ID

    const buyOrders = await this.buyOrderRepository.find({
      where: whereCondition,
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

  async findOrderById(id: UUID) {
    const order = await this.buyOrderRepository.findOne({
      where: { id },
      relations: [
        'client',
        'client.branches',
        'client.branches.address',
        'provider',
        'provider.branches',
        'provider.branches.address',
        'preOrder.criteria',
        'buyOrderProducts.product',
      ],
    });

    // Dynamically compute missing properties
    const clientUser = await this.userRepository.findOne({
      where: { id: order.preOrder.buyerId },
    });

    const providerUser = await this.userRepository.findOne({
      where: { id: order.userId },
    });

    const clientAddress = order.client.branches.find((b) => b.isMain);
    const deliveryAddress = order.client.branches.find(
      (b) => b.id === order.preOrder.criteria.branchId,
    );

    const providerAddress = order.provider.branches.find((b) => b.isMain);

    // Transform entity into DTO and attach computed properties
    const orderDto = plainToInstance(OrderDto, order, {
      excludeExtraneousValues: true,
    });

    orderDto.client.user = plainToInstance(UserDto, clientUser, {
      excludeExtraneousValues: true,
    });

    orderDto.client.deliveryAddress = plainToInstance(
      AddressDto,
      {
        ...deliveryAddress.address,
        phoneNumber: deliveryAddress.phoneNumber,
        email: deliveryAddress.email,
      },
      {
        excludeExtraneousValues: true,
      },
    );

    orderDto.client.address = plainToInstance(
      AddressDto,
      {
        ...clientAddress.address,
        phoneNumber: clientAddress.phoneNumber,
        email: clientAddress.email,
      },
      {
        excludeExtraneousValues: true,
      },
    );

    orderDto.provider.user = plainToInstance(UserDto, providerUser, {
      excludeExtraneousValues: true,
    });

    orderDto.provider.address = plainToInstance(
      AddressDto,
      {
        ...providerAddress.address,
        phoneNumber: providerAddress.phoneNumber,
        email: providerAddress.email,
      },
      {
        excludeExtraneousValues: true,
      },
    );

    return orderDto;
  }
}

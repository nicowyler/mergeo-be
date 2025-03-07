import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreOrder } from './entities/pre-order.entity';
import { CartProductDto, CreatePreOrderDto } from './dto/create-pre-order.dto';
import { Product } from 'src/modules/product/entities/product.entity';
import { UUID } from 'crypto';
import { ProductService } from 'src/modules/product/services/product.service';
import { User } from 'src/modules/user/user.entity';
import { PreOrderProduct } from 'src/modules/pre-order/entities/pre-order-product.entity';
import { PreOrderCriteria } from 'src/modules/pre-order/entities/pre-order-criterias.entity';
import { PRE_ORDER_STATUS } from 'src/common/enum/preOrder.enum';
import { PreOrderProcessor } from 'src/modules/pre-order/pre-order.processor';
import { calculateDeadline } from 'src/common/utils/date.utils';
import { BuyOrderService } from 'src/modules/buy-order/buy-order.service';
import {
  SERVER_SENT_EVENT,
  SERVER_SENT_EVENTS,
} from 'src/common/enum/serverSentEvents.enum';
import { TypedEventEmitter } from 'src/modules/event-emitter/typed-event-emitter.class';
import { ReplacementCriteria } from 'src/common/enum/replacementCriteria.enum';
import { Company } from 'src/modules/company/entities/company.entity';

const preOrderConfig = {
  retryLimit: 3,
  deadline: { h: 3 },
};

@Injectable()
export class PreOrderService {
  constructor(
    @InjectRepository(PreOrder)
    private readonly preOrderRepository: Repository<PreOrder>,
    @InjectRepository(PreOrderProduct)
    private readonly preOrderProductRepository: Repository<PreOrderProduct>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(PreOrderCriteria)
    private readonly preOrderCriteriaRepository: Repository<PreOrderCriteria>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly productService: ProductService,
    private readonly preOrderQueue: PreOrderProcessor,
    private readonly buyOrderService: BuyOrderService,
    private readonly eventEmitter: TypedEventEmitter,
  ) {}

  // Method to notify order status change
  private async notifyOrderStatusChange(
    message: SERVER_SENT_EVENTS,
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
      message,
    });

    console.log('Emitting update');
  }

  // Creates pre-orders and adds them to the queue (grouped by provider)
  async createPreOrders(
    preOrderBody: CreatePreOrderDto,
    buyerId: UUID,
    instance = 1,
  ) {
    try {
      const { cartProducts, replacementCriteria, searchParams } = preOrderBody;

      // Fetch the user to get the company
      const user = await this.userRepository.findOne({
        where: { id: buyerId },
        relations: ['company'], // Ensure the company relation is loaded
      });

      if (!user || !user.company) {
        throw new Error(`User with ID ${buyerId} or their company not found`);
      }

      const clientCompany = user.company; // Get the company from the user

      // Group products by provider (company)
      const productsByProvider = cartProducts.reduce((acc, item) => {
        const productEntity = acc[item.providerId] || [];
        productEntity.push(item);
        acc[item.providerId] = productEntity;
        return acc;
      }, {});

      // TODO
      // tengo que cambiar un poco esta logica para agrupe por provider y despues mande las preOrdenes
      // Create one pre-order per provider
      for (const providerId in productsByProvider) {
        const provider = await this.companyRepository.findOne({
          where: { id: providerId as UUID },
        });

        if (!provider) {
          throw new Error(`Provider with ID ${providerId} not found`);
        }

        const productsForProvider = productsByProvider[providerId];
        const deadline = calculateDeadline(preOrderConfig.deadline);

        // Create PreOrder entity
        const preOrder = this.preOrderRepository.create({
          client: clientCompany,
          provider,
          buyerId: buyerId,
          status: PRE_ORDER_STATUS.pending,
          instance: instance,
          responseDeadline: deadline, // 1-hour response deadline
        });
        // Create PreOrderCriteria entity from searchParams and replacementCriteria
        // save PreOrderCriteria for search next best option and to have data for further analysis
        const preOrderCriteria = this.preOrderCriteriaRepository.create({
          branchId: searchParams.branchId,
          expectedDeliveryStartDay: searchParams.expectedDeliveryStartDay,
          expectedDeliveryEndDay: searchParams.expectedDeliveryEndDay,
          startHour: searchParams.startHour,
          endHour: searchParams.endHour,
          name: searchParams.name,
          brand: searchParams.brand,
          baseMeasurementUnit: searchParams.baseMeasurementUnit,
          isPickUp: searchParams.isPickUp,
          pickUpLng: searchParams.pickUpLng,
          pickUpLat: searchParams.pickUpLat,
          pickUpRadius: searchParams.pickUpRadius,
          replacementCriteria: replacementCriteria, // Assuming this is an enum or string
        });

        // Save PreOrder entity first
        await this.preOrderRepository.save(preOrder);

        // Associate PreOrderCriteria with PreOrder
        preOrderCriteria.preOrder = preOrder;

        // Save PreOrderCriteria entity
        await this.preOrderCriteriaRepository.save(preOrderCriteria);

        // Now create PreOrderProduct entities for each product
        const preOrderProducts = productsForProvider.map((item) =>
          this.preOrderProductRepository.create({
            preOrder: preOrder, // Associate with the newly created pre-order
            product: item.id, // Find the product by ID
            quantity: item.quantity,
          }),
        );

        // Save all PreOrderProduct entities
        await this.preOrderProductRepository.save(preOrderProducts);

        // Add the pre-order to the pre-order queue
        await this.preOrderQueue.addPreOrderJob(preOrder.id, {
          ...preOrder,
          status: PRE_ORDER_STATUS.pending,
          delay: deadline, // coming from calculateDeadline(0,0,30)
        });

        this.notifyOrderStatusChange(
          SERVER_SENT_EVENTS.preOrderCreated,
          preOrder.id,
          preOrder.client.id,
          preOrder.provider.id,
        );

        return {
          message: `Pre-order created successfully`,
          preOrderId: preOrder.id,
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async changePreOrderProdcuts(
    preOrder: PreOrder,
    acceptedProducts: CartProductDto[],
    rejectedProducts: CartProductDto[],
  ) {
    // -----------------------------------------------------------------
    // Update product statuses based on accepted/rejected arrays
    // Save updates to each pre-order product's status

    for (const preOrderProduct of preOrder.preOrderProducts) {
      if (acceptedProducts.some((p) => p.id === preOrderProduct.id)) {
        preOrderProduct.accepted = true; // Accepted
      } else if (rejectedProducts.some((p) => p.id === preOrderProduct.id)) {
        preOrderProduct.accepted = false; // Rejected
      }
    }
    await this.preOrderRepository.save(preOrder);
    // -----------------------------------------------------------------
  }

  // Handle provider response for pre-order acceptance/rejection
  async handleProviderResponse(
    preOrderId: UUID,
    userId: UUID,
    acceptedProducts: CartProductDto[],
    rejectedProducts: CartProductDto[],
    preOrderStatus: PRE_ORDER_STATUS,
  ) {
    const preOrder = await this.preOrderRepository.findOne({
      where: { id: preOrderId },
      relations: [
        'preOrderProducts',
        'preOrderProducts.product',
        'criteria',
        'provider',
        'client',
      ], // Load the associated pre-order products
    });

    if (!preOrder) {
      throw new Error(`Pre-order with ID ${preOrderId} not found`);
    }

    // we check if the instance is 5 or grater and
    // if it is we update the status to fail and kill the job
    if (preOrder.instance >= preOrderConfig.retryLimit) {
      preOrder.status = PRE_ORDER_STATUS.fail;
      await this.preOrderRepository.save(preOrder);
      await this.preOrderQueue.finishJob(preOrder.id);

      this.notifyOrderStatusChange(
        SERVER_SENT_EVENTS.preOrderFail,
        preOrder.id,
        preOrder.buyOrder.id,
        preOrder.provider.id,
      );

      return preOrder;
    }

    switch (preOrderStatus) {
      // All the products were accepted, we create an order
      case PRE_ORDER_STATUS.accepted:
        if (preOrder.status != PRE_ORDER_STATUS.pending) {
          throw new BadRequestException(
            `Pre-order with ID ${preOrder.id} expired!`,
          );
        }

        await this.changePreOrderProdcuts(
          preOrder,
          acceptedProducts,
          rejectedProducts,
        );

        this.buyOrderService.createOrder({
          client: preOrder.client,
          userId: userId,
          provider: preOrder.provider,
          acceptedProducts: acceptedProducts,
          preOrder: preOrder,
        });

      case PRE_ORDER_STATUS.partialyAccepted:
        // If it is partially accepted we create an order with the accepted products
        // a new PreOrder will be created with the remaining products
        if (preOrder.status != PRE_ORDER_STATUS.pending) {
          throw new BadRequestException(
            `Pre-order with ID ${preOrder.id} expired!`,
          );
        }
        console.log('CREATE ORDER WITH ACCEPTED PRODUCTS');
        console.log(acceptedProducts);
        console.log('-------');

        await this.changePreOrderProdcuts(
          preOrder,
          acceptedProducts,
          rejectedProducts,
        );

        this.buyOrderService.createOrder({
          userId: userId,
          client: preOrder.client,
          provider: preOrder.provider,
          acceptedProducts: acceptedProducts,
          preOrder: preOrder,
        });

        break;
      case PRE_ORDER_STATUS.timeout:
        // Update the pre-order status to timeout
        // If it is a timeOut we asume all the products were rejected
        acceptedProducts = [];
        rejectedProducts = preOrder.preOrderProducts.map((item) => {
          return {
            id: item.product.id,
            quantity: item.quantity,
            providerId: preOrder.provider.id,
          };
        });
        break;
      case PRE_ORDER_STATUS.rejected:
        // If the preorder is rejected we send a notification to the client
        // and we update the status to rejected, a new PreOrder will be created
        this.notifyOrderStatusChange(
          SERVER_SENT_EVENTS.preOrderRejected,
          preOrder.id,
          preOrder.client.id,
          preOrder.provider.id,
        );
        break;
    }
    preOrder.status = preOrderStatus;
    await this.preOrderRepository.save(preOrder);

    // Handle rejected products
    if (rejectedProducts.length > 0) {
      const result: boolean = await this.handleRejectedProducts(
        rejectedProducts,
        preOrder.client.id,
        preOrder.criteria,
        preOrder.buyerId,
        preOrder.instance,
      );

      if (!result) {
        this.notifyOrderStatusChange(
          SERVER_SENT_EVENTS.preOrderFail,
          preOrder.id,
          preOrder.buyOrder.id,
          preOrder.provider.id,
        );
      }
    }
    return preOrder;
  }

  async handleRejectedProducts(
    rejectedProducts: CartProductDto[],
    clientCompanyId: UUID,
    searchCriteria: PreOrderCriteria,
    buyerId: UUID,
    instance: number,
  ) {
    let nextProductFound = true;
    // Process each rejected product
    for (const rejectedProduct of rejectedProducts) {
      // Find the next best product for the rejected product
      const nextBestProduct = await this.findNextBestProduct(
        clientCompanyId,
        rejectedProduct,
        searchCriteria,
      );

      if (nextBestProduct) {
        // cartProducts, replacementCriteria, searchParams
        const payload: CreatePreOrderDto = new CreatePreOrderDto();
        payload.replacementCriteria = searchCriteria.replacementCriteria;
        payload.searchParams = searchCriteria;
        payload.cartProducts = [
          {
            id: nextBestProduct.id,
            quantity: nextBestProduct.quantity,
            providerId: nextBestProduct.providerId,
          },
        ];
        // we asume this is a new pre-order so we are updating the instance
        instance = instance + 1;
        // Create new pre-order witht the next best product
        this.createPreOrders(payload, buyerId, instance);
      } else {
        nextProductFound = false;
      }
    }
    return nextProductFound;
  }

  // Find next best provider logic (can be updated based on business logic)
  async findNextBestProduct(
    clientCompanyId: UUID,
    rejected: CartProductDto,
    searchCriteria: PreOrderCriteria,
  ): Promise<CartProductDto | null> {
    try {
      const rejectedProduct = await this.productRepository.findOne({
        where: { id: rejected.id },
      });

      // search for products using the business logic from ProductService
      const searchProductsDto = {
        branchId: searchCriteria.branchId,
        expectedDeliveryStartDay: searchCriteria.expectedDeliveryStartDay,
        expectedDeliveryEndDay: searchCriteria.expectedDeliveryEndDay,
        startHour: searchCriteria.startHour,
        endHour: searchCriteria.endHour,
        name: rejectedProduct.name, // I want to force the search to be the same name as the rejected product
        brand: searchCriteria.brand || '', // here the same but for the brand
        baseMeasurementUnit:
          searchCriteria.baseMeasurementUnit || rejectedProduct.measurementUnit,
        isPickUp: searchCriteria.isPickUp,
        pickUpLat: searchCriteria.pickUpLat,
        pickUpLng: searchCriteria.pickUpLng,
        pickUpRadius: searchCriteria.pickUpRadius,
      };

      const { products } = await this.productService.searchProducts(
        clientCompanyId,
        searchProductsDto,
        true,
      );

      // Filter products based on the replacement criteria
      const filteredProducts = products.filter((product) => {
        if (product.id === rejectedProduct.id) {
          return false; // Exclude the rejected product
        } else {
          switch (searchCriteria.replacementCriteria) {
            // Mejor precio x unidad de medida
            // this is the default behaviour when searching a product
            case ReplacementCriteria.BEST_PRICE_SAME_UNIT:
              return product;

            // Mismo o mejor precio x misma unidad de medida
            case ReplacementCriteria.SAME_PRICE_SAME_UNIT:
              return (
                product.measurementUnit === rejectedProduct.measurementUnit &&
                product.price <= rejectedProduct.price
              );

            // Mismo producto x otra unidad de medida
            case ReplacementCriteria.SAME_PRODUCT_ANOTHER_UNIT:
              return (
                product.measurementUnit !== rejectedProduct.measurementUnit
              );

            default:
              return false; // No criteria matched, filter out
          }
        }
      });
      // Return the best product based on the applied criteria (e.g., the first one in the filtered list)
      if (filteredProducts.length > 0) {
        return {
          id: filteredProducts[0].id,
          quantity: rejected.quantity,
          providerId: filteredProducts[0].company.id,
        };
      }
      return null;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findProrderByStatus(companyId: UUID, status: PRE_ORDER_STATUS) {
    try {
      const preOrders = await this.preOrderRepository.find({
        where: { client: { id: companyId }, status },
        relations: [
          'preOrderProducts',
          'preOrderProducts.product',
          'provider',
          'buyOrder',
        ],
      });
      const sortedPreOrders = preOrders.sort((a, b) => {
        if (a.updated < b.updated) {
          return 1;
        }
        if (a.updated > b.updated) {
          return -1;
        }
        return 0;
      });
      return { count: sortedPreOrders.length, preOrders: sortedPreOrders };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findSellPreOrders(companyId: UUID, status: PRE_ORDER_STATUS) {
    try {
      const preOrders = await this.preOrderRepository.find({
        where: { provider: { id: companyId }, status },
        relations: [
          'preOrderProducts',
          'preOrderProducts.product',
          'client',
          'buyOrder',
        ],
      });

      // Sort preOrders by updated date (descending)
      const sortedPreOrders = preOrders.sort(
        (a, b) => b.updated.getTime() - a.updated.getTime(),
      );

      // Sort preOrderProducts by the accepted flag (accepted ones on top)
      sortedPreOrders.forEach((preOrder) => {
        preOrder.preOrderProducts = preOrder.preOrderProducts.sort((a, b) => {
          if (a.accepted && !b.accepted) return -1; // Accepted comes first
          if (!a.accepted && b.accepted) return 1; // Non-accepted comes later
          return 0; // Retain relative order for products with the same accepted status
        });
      });

      return sortedPreOrders;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async getPreOrderByid(preOrderId: UUID) {
    try {
      const preOrder = await this.preOrderRepository.findOne({
        where: { id: preOrderId },
        relations: ['preOrderProducts', 'preOrderProducts.product', 'client'],
      });
      preOrder.preOrderProducts = preOrder.preOrderProducts.sort((a, b) => {
        if (a.accepted && !b.accepted) return -1; // Accepted comes first
        if (!a.accepted && b.accepted) return 1; // Non-accepted comes later
        return 0; // Retain relative order for products with the same accepted status
      });
      return preOrder;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

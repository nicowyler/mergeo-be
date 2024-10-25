import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PreOrder } from './entities/pre-order.entity';
import { CartProductDto, CreatePreOrderDto } from './dto/create-pre-order.dto';
import { Product } from 'src/modules/product/entities/product.entity';
import { UUID } from 'crypto';
import { Company } from 'src/modules/company/company.entity';
import {
  Instance,
  ReplacementCriteria,
} from 'src/modules/pre-order/dto/search-criteria.dto';
import { ProductService } from 'src/modules/product/product.service';
import { User } from 'src/modules/user/user.entity';
import { PreOrderProduct } from 'src/modules/pre-order/entities/pre-order-product.entity';
import { PreOrderCriteria } from 'src/modules/pre-order/entities/pre-order-criterias.entity';

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
    @InjectQueue('preorder') private preorderQueue: Queue,
  ) {}

  // Creates pre-orders and adds them to the queue (grouped by provider)
  async createPreOrders(
    preOrderBody: CreatePreOrderDto,
    buyerId: UUID,
    instance: number,
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

      // Create one pre-order per provider
      for (const providerId in productsByProvider) {
        const provider = await this.companyRepository.findOne({
          where: { id: providerId as UUID },
        });

        if (!provider) {
          throw new Error(`Provider with ID ${providerId} not found`);
        }

        const productsForProvider = productsByProvider[providerId];

        // Create PreOrder entity
        const preOrder = this.preOrderRepository.create({
          client: clientCompany,
          provider,
          buyerId: buyerId,
          status: 'pending',
          instance: Instance[instance],
          responseDeadline: new Date(Date.now() + 3600000), // 1-hour response deadline
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

        // Add the pre-order to the queue
        await this.preorderQueue.add('process-preorder', {
          buyerId: buyerId,
          clientCompanyId: clientCompany.id,
          preOrderId: preOrder.id,
          instance,
        });

        // Add the pre-order to the timeout queue
        await this.preorderQueue.add(
          'preorder-timeout',
          { preOrderId: preOrder.id, instance },
          {
            delay: 3600000, // Delay for timeout (1 hour)
            attempts: 1, // Retry only once, after the delay
          },
        );
      }
    } catch (error) {
      throw error;
    }
  }

  // Handle provider response for pre-order acceptance/rejection
  async handleProviderResponse(
    preOrderId: UUID,
    acceptedProducts: CartProductDto[],
    rejectedProducts: CartProductDto[],
    preOrderStatus: 'timeout' | 'provider-response',
    instance: number,
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

    // Update the pre-order status to timeout
    // If it is a timeOut we asume all the products are rejected
    if (preOrderStatus === 'timeout') {
      preOrder.status = 'timeout';
      rejectedProducts = preOrder.preOrderProducts.map((item) => {
        return {
          id: item.product.id,
          quantity: item.quantity,
          providerId: preOrder.provider.id,
        };
      });
      await this.preOrderRepository.save(preOrder);
    }

    // Update status based on accepted/rejected products
    if (acceptedProducts.length > 0 && rejectedProducts.length === 0) {
      preOrder.status = 'accepted';
      await this.preOrderRepository.save(preOrder);
    } else if (acceptedProducts.length > 0 && rejectedProducts.length > 0) {
      preOrder.status = 'partialy-accepted';
      await this.preOrderRepository.save(preOrder);
    } else if (acceptedProducts.length === 0 && rejectedProducts.length > 0) {
      preOrder.status = 'rejected';
      await this.preOrderRepository.save(preOrder);
    }

    // TODO:: I have to create the ORDER with the accepted products

    // Handle rejected products
    if (rejectedProducts.length > 0) {
      this.handleRejectedProducts(
        rejectedProducts,
        preOrder.client.id,
        preOrder.criteria,
        preOrder.buyerId,
        instance,
      );
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
      }
    }
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
        brand: rejectedProduct.brand, // here the same but for the brand
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
        }
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
            return product.measurementUnit !== rejectedProduct.measurementUnit;

          default:
            return false; // No criteria matched, filter out
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
}

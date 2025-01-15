import { Injectable, Logger } from '@nestjs/common';
import { Product } from 'src/modules/product/entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from 'src/modules/company/entities/branch.entity';
import { SearchProductsDto } from 'src/modules/product/dto/search-products.dto';
import { getConvertedPricePerUnit } from 'src/modules/product/utils';
import { UUID } from 'crypto';
import { ProductList } from 'src/modules/product/entities/product-list.entity';
import { CreateProductsListDto } from 'src/modules/product/dto/create-productsList.dto';
import { Company } from 'src/modules/company/entities/company.entity';
import { PrdouctInlistDto } from 'src/modules/product/dto/prdouct-in-list.dto';
import { ProductMapper } from 'src/modules/product/productMapper';
import { Gs1ProductDto } from 'src/modules/product/dto/gs1-product.dto';
import { FavoriteList } from 'src/modules/product/entities/favorite-list.entity';
import { BlackList } from 'src/modules/product/entities/black-list.entity';
import { ClientBlackList } from 'src/modules/company/entities/client-black-list.entity';
import { name } from 'ejs';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductList)
    private readonly productListRepository: Repository<ProductList>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(FavoriteList)
    private readonly favoriteListRepository: Repository<FavoriteList>,
    @InjectRepository(BlackList)
    private readonly blackListRepository: Repository<BlackList>,
    @InjectRepository(ClientBlackList)
    private readonly clientBlackListRepository: Repository<ClientBlackList>,
    private readonly productMapper: ProductMapper,
  ) {}

  // PRODUCTS LISTS
  // Provider uses this to get the lists of products
  async getLists(companyId: UUID) {
    return this.productListRepository.find({
      where: { company: { id: companyId } },
    });
  }

  // get products from a list
  async getProductsFromList(listId: UUID) {
    return this.productListRepository.find({
      where: { id: listId },
      relations: ['products'],
    });
  }

  // create a new list
  async createList(body: CreateProductsListDto) {
    try {
      const { name, companyId } = body;

      // Find the company
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Create and save the new product list
      const productList = this.productListRepository.create({ name, company });
      return this.productListRepository.save(productList);
    } catch (error) {
      throw error;
    }
  }

  // PROVIDER - SEARCH PRODUCT
  // search products by name, brand, and netContent
  // This is used by the provider to search for products in their inventory
  async searchProduct(companyId: UUID, searchProductsDto: PrdouctInlistDto) {
    const { name, brand, netContent } = searchProductsDto;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (name) {
      queryBuilder.andWhere('LOWER(product.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    if (brand) {
      queryBuilder.andWhere('LOWER(product.brand) LIKE LOWER(:brand)', {
        brand: `%${brand}%`,
      });
    }

    if (netContent) {
      queryBuilder.andWhere('product.net_content = :netContent', {
        netContent: netContent,
      });
    }

    if (netContent) {
      queryBuilder.andWhere('product.net_content = :netContent', {
        netContent: netContent,
      });
    }

    queryBuilder.andWhere('product.company_id = :companyId', { companyId });
    const results = await queryBuilder.getMany();
    return results;
  }

  findById(id: UUID) {
    return this.productRepository.findOne({ where: { id } });
  }

  // ADD PRODUCT
  async addProduct(productDto: Gs1ProductDto, companyId: UUID, listId: UUID) {
    this.logger.log(`Adding product: ${JSON.stringify(productDto)}`);

    // Transform product data
    const productData = await this.productMapper.transformToEntity(productDto);

    // Fetch related entities
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found`);
    }

    let productList = await this.productListRepository.findOne({
      where: { id: listId },
    });
    if (!productList) {
      this.logger.log(`ProductList with ID ${listId} not found`);

      productList = await this.productListRepository.findOne({
        where: { name: 'General' },
      });

      if (!productList) {
        productList = this.productListRepository.create({ name: 'General' });
        productList = await this.productListRepository.save(productList);
      }
    }

    // Check if product already exists
    let product = await this.productRepository.findOne({
      where: { gtin: productDto.GTIN },
    });

    // if the GTIN already exists, we update the product with incoming data
    if (product) {
      this.logger.log(
        `Product with GTIN ${productDto.GTIN} already exists. Updating product.`,
      );
      product = this.productRepository.merge(product, productData);
    } else {
      // Create new product
      this.logger.log(
        `Product with GTIN ${productDto.GTIN} does not exist. Creating new product.`,
      );
      product = this.productRepository.create(productData);
    }

    // Assign relations
    product.company = company;
    product.lists = [productList]; // Assuming a product can belong to multiple lists

    // Save the product
    return this.productRepository.save(product);
  }

  // Search function using the conversion logic
  async searchProducts(
    companyId: string, // this is the buyer's company id
    searchProductsDto: SearchProductsDto,
    withCompany = false,
  ) {
    const {
      branchId,
      expectedDeliveryStartDay,
      expectedDeliveryEndDay,
      startHour,
      endHour,
      name,
      brand,
      baseMeasurementUnit,
      isPickUp,
      pickUpLat,
      pickUpLng,
      pickUpRadius,
    } = searchProductsDto;

    // Calculate the number of days between start and end
    const diffInDays = Math.floor(
      (new Date(expectedDeliveryEndDay).getTime() -
        new Date(expectedDeliveryStartDay).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const query = this.productRepository.createQueryBuilder('product');

    // Use either join or leftJoin based on the parameter
    if (withCompany) {
      query.leftJoinAndSelect('product.company', 'company'); // Inner join
    } else {
      query
        .leftJoin('product.company', 'company') // Left join
        .select(['product', 'company.id']);
    }
    // Create the base query for products and companies
    query
      .distinctOn(['product.id', 'company.id'])
      .leftJoin('company.dropZones', 'dropZone')
      .leftJoin('dropZone.schedules', 'schedule')
      .leftJoin('dropZone.company', 'dropZoneCompany')
      .leftJoin('company.pickUpPoints', 'pickUpPoint')
      .leftJoin('pickUpPoint.schedules', 'pickUpSchedule')
      .leftJoin(Branch, 'branch', 'branch.id = :branchId', { branchId })
      .leftJoin('branch.address', 'branchAddress')
      .where('company.id != :yourCompanyId', { yourCompanyId: companyId });

    // Always add delivery via drop zone logic
    query
      .andWhere('ST_Contains(dropZone.zone, branchAddress.location)')
      .andWhere(
        `EXISTS (
          SELECT 1
          FROM generate_series(0, :diffInDays) AS g
          WHERE date_part('dow', current_date + g * INTERVAL '1 day') = (
            CASE
              WHEN LOWER(unaccent(schedule.day)) = 'domingo' THEN 0
              WHEN LOWER(unaccent(schedule.day)) = 'lunes' THEN 1
              WHEN LOWER(unaccent(schedule.day)) = 'martes' THEN 2
              WHEN LOWER(unaccent(schedule.day)) = 'miércoles' THEN 3
              WHEN LOWER(unaccent(schedule.day)) = 'jueves' THEN 4
              WHEN LOWER(unaccent(schedule.day)) = 'viernes' THEN 5
              WHEN LOWER(unaccent(schedule.day)) = 'sábado' THEN 6
            END
          )
        )`,
        { diffInDays },
      )
      // Ensure the delivery hours are within the specified range
      .andWhere('schedule.startHour < :endHour', { endHour })
      .andWhere('schedule.endHour > :startHour', { startHour });

    // Retrieve products via drop zone logic
    const dropZoneProducts = await query.getMany();

    // If pick-up is enabled, search in pickUpPoints as well
    let pickUpProducts = [];
    if (isPickUp) {
      const pickUpQuery = this.productRepository.createQueryBuilder('product');
      // Use either join or leftJoin based on the parameter
      if (withCompany) {
        pickUpQuery.innerJoin('product.company', 'company'); // Inner join
      } else {
        pickUpQuery
          .leftJoin('product.company', 'company') // Left join
          .select(['product', 'company.id']);
      }
      pickUpQuery
        .distinctOn(['product.id', 'company.id'])
        .leftJoin('company.pickUpPoints', 'pickUpPoint')
        .leftJoin('pickUpPoint.schedules', 'pickUpSchedule')
        .where('company.id != :yourCompanyId', { yourCompanyId: companyId })
        .andWhere(
          `ST_DWithin(
            (SELECT address.location
             FROM pick_up_point AS pickUpPoint
             INNER JOIN address ON pickUpPoint.addressId = address.id
             WHERE pickUpPoint.company = company.id),
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
            :radius * 1000
          )`,
          {
            longitude: pickUpLng,
            latitude: pickUpLat,
            radius: pickUpRadius,
          },
        )
        .andWhere(
          `EXISTS (
            SELECT 1
            FROM generate_series(0, :diffInDays) AS g
            WHERE date_part('dow', current_date + g * INTERVAL '1 day') = (
              CASE
                WHEN LOWER(unaccent(pickUpSchedule.day)) = 'domingo' THEN 0
                WHEN LOWER(unaccent(pickUpSchedule.day)) = 'lunes' THEN 1
                WHEN LOWER(unaccent(pickUpSchedule.day)) = 'martes' THEN 2
                WHEN LOWER(unaccent(pickUpSchedule.day)) = 'miércoles' THEN 3
                WHEN LOWER(unaccent(pickUpSchedule.day)) = 'jueves' THEN 4
                WHEN LOWER(unaccent(pickUpSchedule.day)) = 'viernes' THEN 5
                WHEN LOWER(unaccent(pickUpSchedule.day)) = 'sábado' THEN 6
              END
            )
          )`,
          { diffInDays },
        )
        // Ensure the pick-up hours are within the specified range
        .andWhere('pickUpSchedule.startHour < :endHour', { endHour })
        .andWhere('pickUpSchedule.endHour > :startHour', { startHour });

      // Retrieve products via pick-up logic
      pickUpProducts = await pickUpQuery.getMany();
      // we add isPickup flag to each product found in the pickup area
      pickUpProducts.map((product) => (product.isPickup = true));
    }

    // Combine results from both queries
    const combinedProducts = [...dropZoneProducts, ...pickUpProducts];

    // Filter products based on blacklist
    const blackListedProducts = await this.blackListRepository
      .createQueryBuilder('blackList')
      .leftJoinAndSelect('blackList.products', 'product')
      .getMany();

    const blackListedProductIds = blackListedProducts.flatMap((bl) =>
      bl.products.map((p) => p.id),
    );

    const blackListedCompanies = await this.clientBlackListRepository.find();
    const blackListedCompanyIds = blackListedCompanies.map((bl) => bl.id);

    let filteredProducts = combinedProducts.filter(
      (product) =>
        !blackListedProductIds.includes(product.id) &&
        !blackListedCompanyIds.includes(product.companyId),
    );

    if (name) {
      filteredProducts = filteredProducts.filter((product) =>
        product.name.toLowerCase().includes(name.toLowerCase()),
      );
    }

    if (brand) {
      filteredProducts = filteredProducts.filter((product) =>
        product.brand.toLowerCase().includes(brand.toLowerCase()),
      );
    }

    // Calculate price per base unit for each product and sort by the lowest price
    const sortedProducts = filteredProducts
      .map((product) => {
        const convertedPrice = getConvertedPricePerUnit(
          product.measurementUnit, // Product's measurement unit
          product.price, // Product's price
          product.unitConversionFactor || 1, // Conversion factor or quantity
          baseMeasurementUnit, // Base unit for comparison (e.g., grams)
        );

        // If the conversion returned null, skip this product
        if (convertedPrice === null) {
          return null; // Or handle this differently, e.g., log a message
        }

        return {
          ...product,
          pricePerBaseUnit: convertedPrice,
        };
      })
      .filter((product) => product !== null); // Filter out null values

    // Sort products by lowest price per base unit
    sortedProducts.sort((a, b) => a.pricePerBaseUnit - b.pricePerBaseUnit);

    // Count the number of sorted products
    const productCount = sortedProducts.length;

    // Optionally, you can return the count along with the sorted products
    return { count: productCount, products: sortedProducts };
  }

  async getNetContentsWithPrices(productId: UUID): Promise<Product[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.name = :name', { name: product.name })
      .andWhere('product.brand = :brand', { brand: product.brand })
      .groupBy('product.id')
      .addGroupBy('product.net_content')
      .orderBy('product.net_content')
      .getRawMany();

    // Filter to get the product with the best price for each net_content
    const bestPriceProducts = products.reduce((acc, curr) => {
      const existingProduct = acc.find(
        (p) => p.product_net_content === curr.product_net_content,
      );
      if (
        !existingProduct ||
        parseFloat(curr.minPrice) < parseFloat(existingProduct.minPrice)
      ) {
        acc = acc.filter(
          (p) => p.product_net_content !== curr.product_net_content,
        );
        acc.push(curr);
      }
      return acc;
    }, []);

    return bestPriceProducts;
  }
}

import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Product,
  ProductWithFavorite,
} from 'src/modules/product/entities/product.entity';
import { In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from 'src/modules/company/entities/branch.entity';
import {
  PaginatedSearchProductsDto,
  SearchProductsDto,
} from 'src/modules/product/dto/search-products.dto';
import { getConvertedPricePerUnit } from 'src/modules/product/utils';
import { UUID } from 'crypto';
import { Company } from 'src/modules/company/entities/company.entity';
import { PrdouctInlistDto } from 'src/modules/product/dto/prdouct-in-list.dto';
import { ProductMapper } from 'src/modules/product/queue/productMapper';
import { Gs1ProductDto } from 'src/modules/product/dto/gs1-product.dto';
import { BlackList } from 'src/modules/product/entities/black-list.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Unit } from 'src/modules/product/entities/unit.entity';
import { DiscountsList } from 'src/modules/product/entities/dicount-list.entity';
import { ProductMetadataDto } from 'src/modules/product/dto/product-metadata.dto';
import { User } from 'src/modules/user/user.entity';
import { ActivityLog } from 'src/modules/product/entities/prouct-activity-log.entity';
import { ActivityEnum } from 'src/common/enum/activityLog.enum';
import { ErrorMessages } from 'src/common/enum';
import { plainToClass } from 'class-transformer';
import {
  ProviderProductResponseDto,
  ProviderSearchPrdoucDto,
} from 'src/modules/product/dto/provider-search-products.dto';
import { Gs1Service } from 'src/modules/gs1/gs1.service';
import { GtinProductDto } from 'src/modules/product/dto/gtinProduct.dto';
import { FavoriteList } from 'src/modules/product/entities/favorite-list.entity';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly appName = process.env.APP_NAME;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(DiscountsList)
    private readonly discountListRepository: Repository<DiscountsList>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(FavoriteList)
    private readonly favoriteRepository: Repository<FavoriteList>,
    @InjectRepository(Unit)
    private readonly unitsRepository: Repository<Unit>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly gs1Setrvice: Gs1Service,
    private readonly productMapper: ProductMapper,
  ) {}

  /**
   * Searches all products(not only own by this company) based on the provided search criteria.
   * If the product already exists in the company's inventory, it returns the product along with a flag indicating that it
   * is already in the company's inventory.
   *
   * @param {ProviderSearchPrdoucDto} searchProductsDto - The DTO containing search criteria.
   * @param {string} searchProductsDto.name - The name of the product to search for.
   * @param {string} searchProductsDto.brand - The brand of the product to search for.
   * @param {string} searchProductsDto.ean - The EAN of the product to search for.
   * @param {number} searchProductsDto.companyId - The ID of the company to search within.
   *
   * @returns {Promise<ProviderProductResponseDto[]>} A promise that resolves to an array of products matching the search criteria,
   * each product includes a flag indicating if it is related to the specified company.
   */
  async searchProviderProducts(
    searchProductsDto: Omit<ProviderSearchPrdoucDto, 'includeInventory'>,
  ) {
    const { name, brand, ean, companyId } = searchProductsDto;

    if (ean) {
      return this.searchProductByEan(ean, companyId);
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .distinctOn(['product.gtin'])
      .leftJoin('product.company', 'company') // Join to check product-company relationships
      .orderBy('product.gtin')
      .addOrderBy('CASE WHEN company.id = :companyId THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('product.id');

    // If includeInventory is true, search products belonging to the company

    // Exclude products already in the company inventory
    queryBuilder.where((qb) => {
      const subQuery = qb
        .subQuery()
        .select('product.gtin')
        .from('product', 'product')
        .innerJoin('product.company', 'company')
        .where('company.id = :companyId')
        .getQuery();
      return `product.gtin NOT IN ${subQuery}`;
    });

    // Apply additional search filters
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

    queryBuilder.setParameter('companyId', companyId);

    // Execute the query
    const results = await queryBuilder.getMany();

    // Map results to DTO
    const productsWithRelation = results.map((product) => {
      return plainToClass(ProviderProductResponseDto, product, {
        excludeExtraneousValues: true,
      });
    });

    return productsWithRelation;
  }

  /**
   * Searches for products based on the provided criteria.
   * This is used by the provider to search for products in their inventory
   *
   * @param companyId - The UUID of the company to which the products belong.
   * @param searchProductsDto - The DTO containing the search criteria.
   * @param searchProductsDto.name - The name of the product to search for (optional).
   * @param searchProductsDto.brand - The brand of the product to search for (optional).
   * @param searchProductsDto.netContent - The net content of the product to search for (optional).
   * @returns A promise that resolves to an array of products matching the search criteria.
   */
  async searchProductInInventory(
    companyId: UUID,
    searchProductsDto: PrdouctInlistDto,
  ) {
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

    queryBuilder.andWhere('product.company_id = :companyId', { companyId });
    const results = await queryBuilder.getMany();
    return results;
  }

  /**
   * Finds a product by its unique identifier.
   *
   * @param id - The unique identifier (UUID) of the product to find.
   * @returns A promise that resolves to the product entity if found, or null if not found.
   */
  findById(id: UUID) {
    return this.productRepository.findOne({ where: { id } });
  }

  /**
   * Finds a product by its unique identifier.
   *
   * @param id - The unique identifier (UUID) of the product to find.
   * @returns A promise that resolves to the product entity if found, or null if not found.
   */
  async getProductLocallyByGTIN(gtin: string) {
    const product = await this.productRepository.findOne({ where: { gtin } });
    if (!product) {
      return null;
    }
    product.created = new Date();
    product.updated = new Date();
    const newProduct = plainToClass(Product, product);

    this.logger.log(
      `Product with gtin ${gtin} and name ${product.name} found in ${this.appName} database`,
    );
    return newProduct;
  }

  /**
   * Adds multiple products to the database.
   * It uses the `addProduct` method to save each product individually.
   *
   * @param {Gs1ProductDto} productDto - The data transfer object containing product information.
   * @param {UUID} companyId - The unique identifier of the company to which the product belongs.
   * @returns {Promise<Product>} The saved product entity.
   * @throws {Error} If the company with the given ID is not found.
   */
  async addMultipleProducts(
    products: GtinProductDto[] | Product[],
    userId: UUID,
    companyId: UUID,
  ): Promise<Product[]> {
    try {
      const savedProducts: Product[] = [];

      for (const product of products) {
        const transformedProduct = plainToClass(Product, product);
        const addedProduct = await this.addProduct(
          transformedProduct,
          userId,
          companyId,
        );
        savedProducts.push(addedProduct);
      }
      return savedProducts;
    } catch (error) {
      this.logger.error(error);
      if (error.code === '23505') {
        throw new ConflictException(
          'El producto con Gtin/Ean ya está registrado en la empresa',
        );
      } else throw error;
    }
  }

  /**
   * Adds a product to the database. If a product with the same GTIN already exists for the company,
   * it updates the existing product. Otherwise, it creates a new product.
   *
   * @param {Gs1ProductDto} productDto - The data transfer object containing product information.
   * @param {UUID} companyId - The unique identifier of the company to which the product belongs.
   * @returns {Promise<Product>} The saved product entity.
   * @throws {Error} If the company with the given ID is not found.
   */
  async addProduct(
    productDto: Gs1ProductDto | Product,
    userId: UUID,
    companyId: UUID,
    fileName?: string,
  ): Promise<Product> {
    try {
      this.logger.log(`Adding product: ${JSON.stringify(productDto)}`);

      // Transform product data
      const productData = await this.productMapper.transformToEntity(
        productDto,
      );
      const calculatedProduct = await this.calculatePriceBaseUnit(productData);
      productData.pricePerBaseUnit = calculatedProduct.pricePerBaseUnit;

      // Fetch related entities
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      if (!company) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      productData.company = company;

      // Check if a product with the same GTIN exists for the company
      let product = await this.productRepository.findOne({
        where: {
          gtin: productData.gtin,
          company: { id: companyId },
        },
        relations: ['company'],
      });

      if (product) {
        const differences = this.getDifferences(productData, product);

        if (differences === null) {
          return product;
        }
        // Update the product if it already exists
        this.logger.log(
          `Product with GTIN ${
            product.gtin
          } already exists for company ${companyId}. Updating product with
        ${JSON.stringify(differences)}`,
        );

        await this.saveActivityAndMetadata(
          product.id,
          userId,
          ActivityEnum.UPDATED,
          JSON.stringify(differences),
          fileName ? fileName : null,
        );

        product = await this.productRepository.merge(product, productData);
        return this.productRepository.save(product);
      } else {
        // Create a new product for the company
        this.logger.log(
          `Product with GTIN ${productData.gtin} does not exist for company ${companyId}. Creating new product.`,
        );

        product = this.productRepository.create(productData);
        product = await this.productRepository.save(product);

        await this.saveActivityAndMetadata(
          product.id,
          userId,
          ActivityEnum.CREATED,
          fileName
            ? JSON.stringify({ message: 'Producto cargado desde archivo' })
            : JSON.stringify({ message: 'Producto cargado manualmente' }),
          fileName ? fileName : null,
        );

        return product;
      }

      // Save the product
    } catch (error) {
      this.logger.error(error);
      if (error.code === '23505') {
        throw new ConflictException(
          'El producto con Gtin/Ean ya está registrado en la empresa',
        );
      } else throw error;
    }
  }

  async paginatedSearchProducts(
    companyId: string,
    searchProductsDto: PaginatedSearchProductsDto,
  ) {
    const page = Math.max(1, searchProductsDto.page || 1);
    const pageSize = Math.max(1, searchProductsDto.pageSize || 10);
    const skip = (page - 1) * pageSize;

    const { count, products, message } = await this.searchProducts(
      companyId,
      searchProductsDto,
      true, // Enable pagination
      { skip, take: pageSize },
    );

    const totalPages = Math.ceil(count / pageSize);

    return {
      products,
      total: count,
      count: products.length,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      message,
    };
  }

  /**
   * CLIENT SEARCH
   *
   * @param companyId - The ID of the buyer's company.
   * @param searchProductsDto - The DTO containing search criteria.
   * @param withCompany - Whether to include company details in the result.
   * @returns A promise that resolves to an object containing the count of products, the list of products, and an optional message.
   *
   * The search criteria include:
   * - branchId: The ID of the branch.
   * - expectedDeliveryStartDay: The start day for expected delivery.
   * - expectedDeliveryEndDay: The end day for expected delivery.
   * - startHour: The start hour for delivery or pick-up.
   * - endHour: The end hour for delivery or pick-up.
   * - name: The name of the product.
   * - brand: The brand of the product.
   * - isPickUp: Whether to include pick-up points in the search.
   * - pickUpLat: The latitude for the pick-up location.
   * - pickUpLng: The longitude for the pick-up location.
   * - pickUpRadius: The radius for the pick-up location.
   *
   * The function performs the following steps:
   * 1. Calculates the number of days between the start and end delivery dates.
   * 2. Constructs a query to search for products available via drop zones.
   * 3. Optionally includes company details based on the `withCompany` parameter.
   * 4. Filters products based on delivery schedules and hours.
   * 5. If pick-up is enabled, constructs a query to search for products available via pick-up points.
   * 6. Combines results from both drop zone and pick-up queries.
   * 7. Filters out blacklisted products.
   * 8. Filters products based on name and brand.
   * 9. Applies discounts to the products. (improvement ==> add this to the queries)
   * 10. Sorts products by price per base unit.
   * 11. Returns the count and list of sorted products.
   */
  async searchProducts(
    companyId: string, // this is the buyer's company id
    searchProductsDto: SearchProductsDto,
    withPagination = true, // New parameter to toggle pagination
    pagination?: { skip: number; take: number }, // Optional pagination for custom cases
  ): Promise<{
    count: number;
    products: ProductWithFavorite[];
    message?: string;
  }> {
    const {
      branchId,
      expectedDeliveryStartDay,
      expectedDeliveryEndDay,
      startHour,
      endHour,
      name,
      brand,
      isPickUp,
      pickUpLat,
      pickUpLng,
      pickUpRadius,
      onlyFavorites,
    } = searchProductsDto;

    const diffInDays = Math.floor(
      (new Date(expectedDeliveryEndDay).getTime() -
        new Date(expectedDeliveryStartDay).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.company', 'company')
      .leftJoin('company.dropZones', 'dropZone')
      .leftJoin('dropZone.schedules', 'schedule')
      .leftJoin('company.pickUpPoints', 'pickUpPoint')
      .leftJoin('pickUpPoint.schedules', 'pickUpSchedule')
      .leftJoin(Branch, 'branch', 'branch.id = :branchId', { branchId })
      .leftJoin('branch.address', 'branchAddress')
      .leftJoin(
        'company.favoriteLists',
        'favoriteList',
        'favoriteList.company = :companyId',
        { companyId },
      )
      .leftJoin('favoriteList.products', 'favoriteProduct')
      .addSelect(
        `EXISTS (
          SELECT 1
          FROM favorite_list fl
          INNER JOIN favorite_list_products_product flp
          ON fl.id = flp."favorite_list_id"
          WHERE fl."company_id" = :companyId
          AND flp."product_id" = product.id
        )`,
        'isFavorite',
      )
      .where('company.id != :yourCompanyId', { yourCompanyId: companyId })
      .andWhere('product.isActive = true')
      .leftJoin('product.blackLists', 'blackList')
      .andWhere(
        `NOT EXISTS (
          SELECT 1
          FROM black_list bl
          INNER JOIN black_list_products_product blp
          ON bl.id = blp."black_list_id"
          WHERE bl."company_id" = :companyId
          AND blp."product_id" = product.id
        )`,
        { companyId },
      )
      .andWhere('LOWER(product.name) LIKE LOWER(:name)', {
        name: name ? `%${name}%` : '%',
      })
      .andWhere('LOWER(product.brand) LIKE LOWER(:brand)', {
        brand: brand ? `%${brand}%` : '%',
      })
      .addSelect(
        `EXISTS (
          SELECT 1
          FROM product AS relatedProduct
          WHERE relatedProduct.name = product.name
          AND relatedProduct.brand = product.brand
          AND relatedProduct.id != product.id
          AND (
            relatedProduct.net_content IS DISTINCT FROM product.net_content
            OR relatedProduct.measurement_unit IS DISTINCT FROM product.measurement_unit
          )
        )`,
        'hasMorePresentations',
      )
      .addSelect(
        `(
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM pick_up_point AS pup
              INNER JOIN address AS addr ON pup."addressId" = addr.id
              INNER JOIN product AS prod ON prod.company_id = pup."companyId"
              WHERE ST_DWithin(
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
                addr.location,
                :radius * 1000
              )
              AND prod.id = product.id
            )
            THEN true
            ELSE false
          END
        )::boolean`,
        'product_isPickUp',
      )
      .andWhere(
        `
        (
          ST_Contains(dropZone.zone, branchAddress.location)
          AND EXISTS (
            SELECT 1 FROM (SELECT generate_series(0, :diffInDays) AS g) AS series
            WHERE date_part('dow', current_date + series.g * INTERVAL '1 day') = (
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
          )
          AND schedule.startHour < :endHour
          AND schedule.endHour > :startHour
        )
        OR
        (
          :isPickUp = true
          AND ST_DWithin(
            (SELECT ST_Union(address.location)
             FROM pick_up_point AS pickUpPoint
             INNER JOIN address ON pickUpPoint.addressId = address.id
             WHERE pickUpPoint.company = company.id),
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
            :radius * 1000
          )
          AND EXISTS (
            SELECT 1 FROM (SELECT generate_series(0, :diffInDays) AS g) AS series
            WHERE date_part('dow', current_date + series.g * INTERVAL '1 day') = (
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
          )
          AND pickUpSchedule.startHour < :endHour
          AND pickUpSchedule.endHour > :startHour
        )
      `,
        {
          diffInDays,
          endHour,
          startHour,
          isPickUp,
          longitude: pickUpLng,
          latitude: pickUpLat,
          radius: pickUpRadius,
        },
      );

    if (onlyFavorites) {
      query.andWhere((qb) => {
        qb.where(
          `EXISTS (
            SELECT 1
            FROM favorite_list fl
            INNER JOIN favorite_list_products_product flp
            ON fl.id = flp."favorite_list_id"
            WHERE fl."company_id" = :companyId
            AND flp."product_id" = product.id
          )`,
        );
      });
    }

    query.addSelect('company.id', 'providerId');
    query.groupBy('product.id, company.id');

    if (withPagination && pagination) {
      query.skip(pagination.skip).take(pagination.take);
    }

    // eslint-disable-next-line prefer-const
    let { raw, entities: products } = await query.getRawAndEntities();

    products.map((p, index) => {
      p.isPickUp = raw[index].product_isPickUp;
      p.isFavorite =
        raw[index]?.isFavorite === 'true' || raw[index]?.isFavorite === true;
      p.providerId = raw[index].providerId;
      p.morePresentations =
        raw[index]?.hasMorePresentations === 'true' ||
        raw[index]?.hasMorePresentations === true;
    });

    products = await this.applyDiscounts(products, companyId);

    // Sort products by price
    products.sort((a, b) => a.pricePerBaseUnit - b.pricePerBaseUnit);

    const count = withPagination ? await query.getCount() : products.length;

    return { count, products };
  }

  /**
   * Retrieves a list of products with their net contents and the best prices for each net content.
   *
   * @param {UUID} productId - The unique identifier of the product.
   * @returns {Promise<Product[]>} A promise that resolves to an array of products with the best prices for each net content.
   * @throws {Error} If the product is not found.
   */
  async getNetContentsWithPrices(productId: UUID): Promise<Product[]> {
    const initialProduct = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!initialProduct) {
      throw new Error('Product not found');
    }

    const rawProducts = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.company', 'company')
      .where('product.name = :name', { name: initialProduct.name })
      .andWhere('product.brand = :brand', { brand: initialProduct.brand })
      .andWhere('product.isActive = true')
      .andWhere(
        '(product.net_content != :netContent OR product.measurementUnit != :measurementUnit)',
        {
          netContent: initialProduct.net_content,
          measurementUnit: initialProduct.measurementUnit,
        },
      )
      .groupBy('product.id')
      .addGroupBy('company.id')
      .addGroupBy('product.net_content')
      .addGroupBy('product.measurementUnit')
      .orderBy('product.net_content')
      .getRawMany(); // <-- Fetch raw results with selected fields

    // Convert raw results to Product entities while adding providerId
    const products = rawProducts.map((raw): Product => {
      // Create a new object removing 'product_' prefix from keys
      const cleanedData = Object.keys(raw).reduce((acc, key) => {
        const newKey = key.startsWith('product_')
          ? key.replace('product_', '')
          : key;
        acc[newKey] = raw[key];
        return acc;
      }, {});

      // Create product entity with cleaned data
      const result: Product = plainToClass(Product, {
        ...cleanedData,
        providerId: raw.product_company_id,
      });

      delete (result as any).company_id;
      return result;
    });

    // Filter to get the product with the best price for each net_content
    const bestPriceProducts = products.reduce<Product[]>((acc, curr) => {
      const existingProduct = acc.find(
        (p) => p.net_content === curr.net_content,
      );

      if (!existingProduct || curr.price < existingProduct.price) {
        // Remove previous product with the same net_content (if any)
        const filteredAcc = acc.filter(
          (p) => p.net_content !== curr.net_content,
        );
        return [...filteredAcc, curr]; // Add the new product
      }

      return acc; // Keep the existing accumulator if the condition isn't met
    }, []);

    return bestPriceProducts;
  }

  /**
   * Calculates the price per base unit for a given product.
   *
   * @param product - A partial product object containing at least the measurement unit, price, and unit conversion factor.
   * @returns A promise that resolves to the updated partial product object with the calculated price per base unit, or null if the conversion fails.
   *
   * @remarks
   * - The function retrieves the units using the `getUnits` method.
   * - If any of the required fields (measurement unit, price, or unit conversion factor) are null, the original product is returned.
   * - The `getConvertedPricePerUnit` function is used to calculate the price per base unit.
   * - If the conversion returns null, the function returns null.
   * - The calculated price per base unit is assigned to the `pricePerBaseUnit` property of the product.
   */
  private async calculatePriceBaseUnit(
    product: Partial<Product>,
  ): Promise<Partial<Product>> {
    const units = await this.getUnits();

    if (
      product.measurementUnit === null ||
      product.price === null ||
      product.unitConversionFactor === null
    ) {
      return product;
    }

    const convertedPrice = getConvertedPricePerUnit(
      units,
      product.measurementUnit, // Product's measurement unit
      product.price, // Product's price
      product.unitConversionFactor || 1, // Conversion factor or quantity
      product.measurementUnit,
      product.net_content,
    );

    // If the conversion returned null, skip this product
    if (convertedPrice === null) {
      return null; // Or handle this differently, e.g., log a message
    }

    product.pricePerBaseUnit = convertedPrice;

    return product;
  }

  /**
   * Retrieves a list of unit standard names from the cache or database.
   *
   * This method first attempts to retrieve the list of units from the cache.
   * If the units are not found in the cache, it fetches them from the database,
   * stores them in the cache, and then returns the list.
   *
   * @returns {Promise<string[]>} A promise that resolves to an array of unit standard names.
   */
  private async getUnits(): Promise<string[]> {
    let units: string[] | undefined = await this.cacheManager.get('units');

    if (!units) {
      units = await this.unitsRepository
        .find({
          select: ['standardName'],
        })
        .then((units) => units.map((unit) => unit.standardName));
      await this.cacheManager.set('units', units);
    }

    return units;
  }

  /**
   * Applies discounts to a list of products based on the company's discount lists.
   *
   * @param {Product[]} products - The list of products to which discounts will be applied.
   * @param {string} companyId - The ID of the company to fetch the discount lists for.
   * @returns {Promise<Product[]>} - A promise that resolves to the list of products with applied discounts.
   *
   * @throws {Error} - Throws an error if there is an issue fetching the discount lists.
   */
  private async applyDiscounts(
    products: Product[],
    companyId: string,
  ): Promise<Product[]> {
    // Fetch product lists where the company is listed as a receiver of the discount
    const productLists = await this.discountListRepository
      .createQueryBuilder('productList')
      .leftJoinAndSelect('productList.products', 'product')
      .leftJoinAndSelect('productList.companies', 'company') // Join companies receiving the discount
      .where('company.id = :companyId', { companyId }) // Ensure the company is one of the listed companies
      .andWhere('productList.discount IS NOT NULL') // Ensure there is a discount in the list
      .getMany();

    // Apply discounts to the products
    const discountedProducts = products.map((product) => {
      // Find the product list that contains the product and is associated with the given company
      const list = productLists.find((list) =>
        list.products.some((p) => p.id === product.id),
      );

      if (list) {
        product.price = product.price * (1 - list.discount / 100); // Apply the discount
      }

      return product;
    });

    return discountedProducts;
  }

  /**
   * Retrieves the metadata for a specific product by its ID.
   *
   * @param {UUID} productId - The unique identifier of the product.
   * @returns {Promise<Product>} - A promise that resolves to an object containing the product metadata.
   * @throws {Error} If the product is not found.
   */
  async getProductById(productId: UUID): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id: productId });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Retrieves the metadata for a specific product by its ID.
   *
   * @param {UUID} productId - The unique identifier of the product.
   * @returns {Promise<Product>} - A promise that resolves to an object containing the product metadata.
   * @throws {Error} If the product is not found.
   */
  async editProductById(
    productId: UUID,
    userId: UUID,
    changes: Partial<Product>,
  ): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id: productId });

    if (!product) {
      throw new Error('Product not found');
    }

    const differences: { [key: string]: string | number } = {};

    if (
      'description' in changes &&
      changes.description !== product.description
    ) {
      differences.description = changes.description;
    }

    if ('price' in changes && changes.price !== product.price) {
      const changingProduct = { ...product, price: changes.price };
      const newBasePrice = await this.calculatePriceBaseUnit(changingProduct);
      differences.price = +changes.price;
      product.pricePerBaseUnit = newBasePrice.pricePerBaseUnit;
    }

    const activityChanges: Record<
      string,
      { old: string | number; new: string | number }
    > = {};

    if (differences.description) {
      activityChanges.description = {
        old: product.description,
        new: changes.description,
      };
    }

    if (differences.price) {
      activityChanges.price = { old: product.price, new: changes.price };
    }

    // we check if activeChanges has any key to avoid unecessary calls
    if (Object.keys(activityChanges).length > 0) {
      await this.saveActivityAndMetadata(
        product.id,
        userId,
        ActivityEnum.UPDATED,
        JSON.stringify(activityChanges),
      );
    }

    product.description = changes.description || product.description;
    product.price = changes.price || product.price;
    if ('isActive' in changes) product.isActive = changes.isActive;

    product.updated = new Date();
    this.productRepository.save(product);

    return product;
  }

  /**
   * Retrieves the metadata for a specific product by its ID.
   *
   * @param {UUID} productId - The unique identifier of the product.
   * @returns {Promise<ProductMetadataDto>} - A promise that resolves to an object containing the product metadata.
   * @throws {Error} If the product is not found.
   */
  async getProductMetadata(productId: UUID): Promise<ProductMetadataDto> {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.lists', 'discountList') // Include discount lists
      .leftJoinAndSelect('product.userActivity', 'activityLog')
      .leftJoinAndSelect('activityLog.user', 'user') // Include user details
      .where('product.id = :productId', { productId })
      .addOrderBy('activityLog.timestamp', 'DESC')
      .getOne();

    if (!product) {
      throw new Error('Product not found');
    }

    return {
      id: product.id,
      name: product.name,
      created: product.created,
      updated: product.updated,
      metadata: {
        belongsToDiscountLists: product.lists.map((list) => ({
          id: list.id,
          name: list.name,
          description: list.description,
          discount: list.discount,
        })),
      },
      userActivity: product.userActivity.map((activity) => ({
        action: activity.action,
        timestamp: activity.timestamp,
        user: activity.user ? activity.user.email : 'Unknown',
        details: JSON.parse(activity.details),
        fileName: activity.fileName,
      })),
    };
  }

  /**
   * Logs an activity and saves metadata for a product
   * @param productId - ID of the product
   * @param action - Activity action (created, updated, deleted)
   * @param user - The user performing the action
   * @param metadata - Additional metadata (e.g., filename)
   */
  async saveActivityAndMetadata(
    productId: UUID,
    userId: UUID,
    action: ActivityEnum,
    details?: string,
    fileName?: string,
  ): Promise<void> {
    // Fetch the product
    const product = await this.productRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('Product not found');
    }

    // Create the activity log
    const activityLog = this.activityLogRepository.create({
      action,
      product,
      user,
      fileName: fileName,
      details: details,
    });

    // Save activity log
    await this.activityLogRepository.save(activityLog);
  }

  private getDifferences(
    newProduct: Partial<Product>,
    oldProduct: Partial<Product>,
  ): Record<string, { old: any; new: any }> | string {
    const changes: Record<string, { old: any; new: any }> = {};

    for (const key in oldProduct) {
      if (key === 'created' || key === 'updated' || key === 'id') {
        continue; // Skip 'id', 'created' and 'updated' fields
      }
      const oldValue = oldProduct[key];
      const newValue = newProduct[key];

      // Normalize values to compare them logically
      const normalizedOldValue =
        oldValue !== null && oldValue !== undefined ? String(oldValue) : '';
      const normalizedNewValue =
        newValue !== null && newValue !== undefined ? String(newValue) : '';

      // Compare normalized values
      if (normalizedOldValue !== normalizedNewValue) {
        changes[key] = { old: oldValue, new: newValue };
      }
    }

    // Remove unchanged fields from nested objects
    for (const key in changes) {
      const { old, new: newVal } = changes[key];
      if (typeof old === 'object' && typeof newVal === 'object') {
        if (JSON.stringify(old) === JSON.stringify(newVal)) {
          delete changes[key]; // Remove if nested object is identical
        }
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  /**
   * Searches for a product by its EAN (European Article Number) and checks if it belongs to a specific company.
   *
   * @param ean - The EAN of the product to search for.
   * @param companyId - The UUID of the company to check the product against.
   * @returns A promise that resolves to an array containing the product data and a flag indicating if the product is related to the company.
   * @throws NotFoundException - If the product is not found in both the local database and GS1 service.
   */
  private async searchProductByEan(ean: string, companyId: UUID) {
    if (ean) {
      // Search the product in your local database
      let product = await this.getProductLocallyByGTIN(ean);

      if (product) {
        // Check if the product belongs to the company
        const isRelated =
          (await this.productRepository
            .createQueryBuilder('product')
            .innerJoin('product.company', 'company')
            .where('company.id = :companyId', { companyId })
            .andWhere('product.id = :productId', { productId: product.id })
            .getCount()) > 0;

        if (isRelated) {
          return [];
        }

        // Map product to DTO and include the flag
        const result = plainToClass(ProviderProductResponseDto, product, {
          excludeExtraneousValues: true,
        });

        return [{ ...result }];
      }

      // If not found locally, search in GS1
      product = await this.gs1Setrvice.getProductByGTIN(ean);
      if (!product) {
        throw new NotFoundException(ErrorMessages.PRODUCT_NOT_FOUND);
      }

      // Transform GS1 product data to entity
      const productData = await this.productMapper.transformToEntity(product);

      return [{ ...productData, inInventory: false }]; // Return GS1 product without isRelated flag
    }
  }
}

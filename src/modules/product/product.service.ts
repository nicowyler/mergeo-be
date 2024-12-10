import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from 'src/modules/product/entities/product.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from 'src/modules/company/branch.entity';
import { SearchProductsDto } from 'src/modules/product/dto/search-products.dto';
import { getConvertedPricePerUnit } from 'src/modules/product/utils';
import { UUID } from 'crypto';
import { ProductList } from 'src/modules/product/entities/productList.entity';
import { CreateProductsListDto } from 'src/modules/product/dto/create-productsList.dto';
import { Company } from 'src/modules/company/company.entity';
import { Gs1SearchProductsDto } from 'src/modules/product/dto/gs1-search.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductList)
    private readonly productListRepository: Repository<ProductList>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  // PRODUCTS LISTS
  async findLists(companyId: UUID) {
    return this.productListRepository.find({
      where: { company: { id: companyId } },
    });
  }

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

  // GS1
  async searchProductsByGS1(searchProductsDto: Gs1SearchProductsDto) {
    const { name, brand } = searchProductsDto;

    if (name == undefined && brand == undefined) {
      return [];
    }

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

    const results = await queryBuilder.getMany();
    return results;
  }

  //PRODUCT
  create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  findAll() {
    return `This action returns all product`;
  }

  findById(id: UUID) {
    return this.productRepository.findOne({ where: { id } });
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }

  // Add the findByIds method
  async findByIds(productIds: UUID[]): Promise<Product[]> {
    if (!productIds || productIds.length === 0) {
      return [];
    }

    // Use find with where clause to match multiple IDs
    return await this.productRepository.find({
      where: {
        id: In(productIds),
      },
      relations: ['company'], // Include the company relation
    });
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

    // Filter combined results by name and brand
    let filteredProducts = combinedProducts;

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
}

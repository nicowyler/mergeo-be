import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { Company } from 'src/modules/company/entities/company.entity';
import {
  CreateProductsListDto,
  UpdateProductsListDto,
} from 'src/modules/product/dto/create-productsList.dto';
import { ProductList } from 'src/modules/product/entities/product-list.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsListService {
  private readonly logger = new Logger(ProductsListService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(ProductList)
    private readonly productListRepository: Repository<ProductList>,
  ) {}

  // PRODUCTS LISTS
  // Provider uses this to get the lists of products
  async getLists(companyId: UUID) {
    try {
      const lists = await this.productListRepository.find({
        where: { company: { id: companyId } },
      });

      if (lists.length === 0) {
        return {
          message: 'No se encontraron listas para este cliente',
          data: [],
        };
      }

      return lists;
    } catch (error) {
      throw error;
    }
  }

  // get products from a list
  async getProductsFromList(listId: UUID) {
    return this.productListRepository.find({
      where: { id: listId },
      relations: ['products'],
    });
  }

  // create a new list
  async createList(companyId: UUID, body: CreateProductsListDto) {
    try {
      const { name, description, discount } = body;

      // Find the company
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Create and save the new product list
      const productList = this.productListRepository.create({
        name,
        description,
        discount,
        company,
      });
      return this.productListRepository.save(productList);
    } catch (error) {
      throw error;
    }
  }

  // we can modify the description and discount applied to the list
  async editList(listId: UUID, body: UpdateProductsListDto) {
    try {
      const { description, discount } = body;
      const list = await this.productListRepository.findOneBy({ id: listId });
      if (!list) {
        throw new NotFoundException('List not found');
      }
      if (discount) list.discount = discount;
      if (description) list.description = description;
      return this.productListRepository.save(list);
    } catch (error) {
      throw error;
    }
  }

  // add Products to a list
  async addProducts(listId: UUID, products: Product[]) {
    try {
      // Find the list with its existing products
      const list = await this.productListRepository.findOne({
        where: { id: listId },
        relations: ['products'],
      });

      if (!list) {
        throw new NotFoundException('List not found');
      }

      if (products && products.length > 0) {
        // Extract the IDs of existing products in the list
        const existingProductIds = new Set(
          list.products.map((product) => product.id),
        );

        // Filter out products already in the list
        const newProducts = products.filter(
          (p) => !existingProductIds.has(p.id),
        );

        if (newProducts.length > 0) {
          // Add new products to the list
          await this.productListRepository
            .createQueryBuilder()
            .relation('products')
            .of(list) // The list to associate products with
            .add(newProducts.map((p) => p.id)); // Add only new product IDs
        }
      }

      // Reload the list with updated products
      return await this.productListRepository.findOne({
        where: { id: listId },
        relations: ['products'],
      });
    } catch (error) {
      throw error;
    }
  }

  // remove products from a list
  async removeProducts(listId: UUID, productId: UUID[]) {
    try {
      const list = await this.productListRepository.findOne({
        where: { id: listId },
        relations: ['products'],
      });

      if (!list) {
        throw new NotFoundException('List not found');
      } else {
        list.products = list.products.filter(
          (product) => !productId.includes(product.id),
        );
        return this.productListRepository.save(list);
      }
    } catch (error) {
      throw error;
    }
  }
}

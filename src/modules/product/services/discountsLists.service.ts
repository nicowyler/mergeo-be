import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUID } from 'crypto';
import { ErrorMessages } from 'src/common/enum';
import { Company } from 'src/modules/company/entities/company.entity';
import {
  CreateProductsListDto,
  UpdateProductsListDto,
} from 'src/modules/product/dto/create-productsList.dto';
import { DiscountsList } from 'src/modules/product/entities/dicount-list.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class DiscountsListService {
  private readonly logger = new Logger(DiscountsListService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(DiscountsList)
    private readonly discountListRepository: Repository<DiscountsList>,
  ) {}

  /**
   * Retrieves the discount lists for a given company.
   *
   * @param {UUID} companyId - The unique identifier of the company.
   * @returns {Promise<object[]>} A promise that resolves to an array of discount lists.
   * If no lists are found, it returns an object with a message and an empty data array.
   * @throws Will throw an error if the operation fails.
   */
  async getLists(
    companyId: UUID,
  ): Promise<object[] | { message: string; data: [] }> {
    try {
      const lists = await this.discountListRepository.find({
        where: { ownerCompany: { id: companyId } },
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

  /**
   * Retrieves the products associated with a specific list.
   *
   * @param {UUID} listId - The unique identifier of the list.
   * @returns {Promise<DiscountsList>} A promise that resolves to the product list with its associated products.
   */
  async getProductsFromList(listId: UUID): Promise<DiscountsList> {
    return this.discountListRepository.findOne({
      where: { id: listId },
      relations: ['products'],
    });
  }

  /**
   * Creates a new discount list for a given company.
   *
   * @param companyId - The UUID of the owner company.
   * @param body - The data transfer object containing the details of the product list to be created.
   * @returns The created product list.
   * @throws Will throw an error if the owner company is not found or if any of the related companies are not found.
   */
  async createList(companyId: UUID, body: CreateProductsListDto) {
    try {
      const { name, description, discount, companies: companyIds } = body;

      // Validate the owner company
      const ownerCompany = await this.companyRepository.findOne({
        where: { id: companyId },
      });

      if (!ownerCompany) {
        throw new NotFoundException(
          `${ErrorMessages.COMPANY_NOT_FOUND} ${companyId}`,
        );
      }

      // Validate and fetch related companies
      const relatedCompanies = await this.companyRepository.find({
        where: { id: In(companyIds) },
      });

      if (relatedCompanies.length !== companyIds.length) {
        const missingIds = companyIds.filter(
          (id) => !relatedCompanies.some((company) => company.id === id),
        );
        throw new NotFoundException(
          `Companies with IDs ${missingIds.join(', ')} not found`,
        );
      }

      // Create and save the product list
      const discountList = this.discountListRepository.create({
        name,
        description,
        discount,
        ownerCompany,
        companies: relatedCompanies,
      });

      await this.discountListRepository.save(discountList);

      return discountList;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adds a list of companies to a specified discount list.
   *
   * @param {UUID} listId - The ID of the product list to which companies will be added.
   * @param {UUID[]} companyIds - An array of company IDs to be added to the product list.
   * @returns {Promise<DiscountsList>} - A promise that resolves to the updated product list.
   *
   * @throws {BadRequestException} - If no company IDs are provided.
   * @throws {NotFoundException} - If the product list or any of the companies are not found.
   */
  async addCompaniesToList(
    listId: UUID,
    companyIds: UUID[],
  ): Promise<DiscountsList> {
    // Validate input
    if (!companyIds || companyIds.length === 0) {
      throw new BadRequestException('No companies provided to add to the list');
    }

    // Find the product list
    const discountList = await this.discountListRepository.findOne({
      where: { id: listId },
      relations: ['companies'], // Ensure companies are loaded
    });

    if (!discountList) {
      throw new NotFoundException(`Product list with ID ${listId} not found`);
    }

    // Fetch the companies to add
    const companies = await this.companyRepository.findBy({
      id: In(companyIds),
    });

    if (companies.length !== companyIds.length) {
      throw new NotFoundException('Some companies were not found');
    }

    // Add companies to the list
    discountList.companies = [...discountList.companies, ...companies];

    // Save the updated list
    return this.discountListRepository.save(discountList);
  }

  /**
   * Removes specified companies from a discount list.
   *
   * @param listId - The UUID of the product list from which companies will be removed.
   * @param companyIds - An array of UUIDs representing the companies to be removed from the list.
   * @returns A promise that resolves to the updated DiscountsList.
   * @throws {BadRequestException} If no company IDs are provided.
   * @throws {NotFoundException} If the product list with the specified ID is not found.
   */
  async removeCompaniesFromList(
    listId: UUID,
    companyIds: UUID[],
  ): Promise<DiscountsList> {
    // Validate input
    if (!companyIds || companyIds.length === 0) {
      throw new BadRequestException(
        'No companies provided to remove from the list',
      );
    }

    // Find the product list
    const discounList = await this.discountListRepository.findOne({
      where: { id: listId },
      relations: ['companies'], // Ensure companies are loaded
    });

    if (!discounList) {
      throw new NotFoundException(`Product list with ID ${listId} not found`);
    }

    // Filter out the companies to be removed
    discounList.companies = discounList.companies.filter(
      (company) => !companyIds.includes(company.id),
    );

    // Save the updated list
    return this.discountListRepository.save(discounList);
  }

  /**
   * Edits an existing discount list with the given list ID.
   *
   * @param listId - The UUID of the product list to be edited.
   * @param body - An object containing the updated description and/or discount for the product list.
   * @returns The updated product list.
   * @throws NotFoundException - If the product list with the given ID is not found.
   */
  async editList(listId: UUID, body: UpdateProductsListDto) {
    try {
      const { description, discount } = body;
      const list = await this.discountListRepository.findOneBy({ id: listId });
      if (!list) {
        throw new NotFoundException('List not found');
      }
      if (discount) list.discount = discount;
      if (description) list.description = description;
      return this.discountListRepository.save(list);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adds products to a specified discount list if they are not already present.
   *
   * @param {UUID} listId - The unique identifier of the product list.
   * @param {Product[]} products - An array of products to be added to the list.
   * @returns {Promise<DiscountsList>} - The updated product list with the newly added products.
   * @throws {NotFoundException} - If the product list with the specified ID is not found.
   */
  async addProducts(listId: UUID, products: Product[]): Promise<DiscountsList> {
    try {
      // Find the list with its existing products
      const list = await this.discountListRepository.findOne({
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
          await this.discountListRepository
            .createQueryBuilder()
            .relation('products')
            .of(list) // The list to associate products with
            .add(newProducts.map((p) => p.id)); // Add only new product IDs
        }
      }

      // Reload the list with updated products
      return await this.discountListRepository.findOne({
        where: { id: listId },
        relations: ['products'],
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Removes products from a discount list.
   *
   * @param {UUID} listId - The ID of the product list.
   * @param {UUID[]} productId - An array of product IDs to be removed from the list.
   * @returns {Promise<DiscountsList>} - The updated product list after removal of specified products.
   * @throws {NotFoundException} - If the product list with the given ID is not found.
   */
  async removeProducts(
    listId: UUID,
    productId: UUID[],
  ): Promise<DiscountsList> {
    try {
      const list = await this.discountListRepository.findOne({
        where: { id: listId },
        relations: ['products'],
      });

      if (!list) {
        throw new NotFoundException('List not found');
      } else {
        list.products = list.products.filter(
          (product) => !productId.includes(product.id),
        );
        return this.discountListRepository.save(list);
      }
    } catch (error) {
      throw error;
    }
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UUID } from 'crypto';
import { Company } from 'src/modules/company/entities/company.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { BlackList } from 'src/modules/product/entities/black-list.entity';
import { FavoritesService } from 'src/modules/product/services/favorits.service';

@Injectable()
export class BlackListService {
  private readonly logger = new Logger(BlackListService.name);

  constructor(
    @InjectRepository(BlackList)
    private readonly blackListRepository: Repository<BlackList>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly favoritesService: FavoritesService,
  ) {}

  /**
   * Finds the blacklist for a given company.
   *
   * @param {UUID} companyId - The unique identifier of the company.
   * @returns {Promise<BlackList>} - A promise that resolves to the blacklist of the company.
   * @throws {NotFoundException} - If the company is not found.
   * @throws {Error} - If the blacklist is not found.
   */
  async find(companyId: UUID): Promise<BlackList> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    const blacklist = await this.blackListRepository.findOne({
      where: { company: { id: company.id } },
      relations: ['products'],
    });

    if (!blacklist) {
      throw new Error('Favorite list not found');
    }
    return blacklist;
  }

  /**
   * Adds products to the blacklist of a specified company.
   *
   * @param companyId - The UUID of the company to which the products belong.
   * @param products - An array of UUIDs or Product entities to be added to the blacklist.
   * @returns A promise that resolves to the updated BlackList entity.
   * @throws NotFoundException - If the company is not found.
   */
  async addProducts(
    companyId: UUID,
    products: UUID[] | Product[],
  ): Promise<BlackList> {
    // Find the company
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Find or create the blacklist
    let blacklist = await this.blackListRepository.findOne({
      where: { company: { id: company.id } },
      relations: ['products'],
    });

    if (!blacklist) {
      blacklist = this.blackListRepository.create({
        company,
        products: [],
      });
    }

    // Normalize the `products` parameter to always work with Product entities
    const productEntities: Product[] = await this.normalizeProducts(products);

    // Add only the products that are not already in the blacklist
    const newProducts = productEntities.filter(
      (product) => !blacklist.products.some((p) => p.id === product.id),
    );

    // Remove the new products from the favorites list
    for (const product of newProducts) {
      await this.favoritesService.removeProduct(companyId, product.id);
    }

    // Add the new products to the blacklist
    blacklist.products.push(...newProducts);

    // Save and return the updated blacklist
    this.logger.log(
      `Blacklist products after adding: ${JSON.stringify(
        blacklist.products.map((p) => p.id),
      )}`,
    );

    return await this.blackListRepository.save(blacklist);
  }

  /**
   * Removes specified products from the blacklist of a given company.
   *
   * @param companyId - The UUID of the company whose blacklist is to be modified.
   * @param products - An array of UUIDs or Product objects representing the products to be removed from the blacklist.
   * @returns A promise that resolves to the updated BlackList object.
   * @throws NotFoundException - If the blacklist for the specified company is not found.
   * @throws Error - If any other error occurs during the process.
   */
  async removeProducts(
    companyId: UUID,
    products: UUID[] | Product[],
  ): Promise<BlackList> {
    try {
      const blacklist = await this.blackListRepository.findOne({
        where: { company: { id: companyId } },
        relations: ['products'], // Ensure products relation is loaded
      });
      if (!blacklist) {
        throw new NotFoundException('blacklist list not found');
      }

      const productEntities: Product[] = await this.normalizeProducts(products);

      blacklist.products = blacklist.products.filter(
        (p) => !productEntities.some((product) => product.id === p.id),
      );
      const newBlackList = await this.blackListRepository.save(blacklist);
      return newBlackList;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Normalizes an array of products by either fetching them from the repository
   * if they are UUIDs or removing duplicates if they are Product entities.
   *
   * @param products - An array of UUIDs or Product entities.
   * @returns A promise that resolves to an array of unique Product entities.
   * @throws NotFoundException - If some products are not found in the repository.
   */
  private async normalizeProducts(
    products: UUID[] | Product[],
  ): Promise<Product[]> {
    if (!(products[0] instanceof Product)) {
      // If products are UUIDs, fetch them from the repository
      const productIds = [...new Set(products as UUID[])]; // Remove duplicates
      const productEntities = await this.productRepository.findBy({
        id: In(productIds),
      });

      if (productEntities.length !== productIds.length) {
        throw new NotFoundException('Some products not found');
      }

      return productEntities;
    } else {
      // If products are Product entities, remove duplicates by ID
      const uniqueProducts = [
        ...new Map((products as Product[]).map((p) => [p.id, p])).values(),
      ];
      return uniqueProducts;
    }
  }
}

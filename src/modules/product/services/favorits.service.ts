import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteList } from '../entities/favorite-list.entity';
import { UUID } from 'crypto';
import { Company } from 'src/modules/company/entities/company.entity';
import { Product } from 'src/modules/product/entities/product.entity';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    @InjectRepository(FavoriteList)
    private readonly favoriteListRepository: Repository<FavoriteList>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Finds and returns the favorite list for a given company.
   *
   * @param {UUID} companyId - The unique identifier of the company.
   * @returns {Promise<FavoriteList>} - A promise that resolves to the favorite list of the company.
   * @throws {Error} - Throws an error if the company or favorite list is not found.
   */
  async find(companyId: UUID): Promise<FavoriteList> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new Error('Company not found');
    }
    const favoriteList = await this.favoriteListRepository.findOne({
      where: { company: { id: company.id } },
      relations: ['products'],
    });

    if (!favoriteList) {
      throw new Error('Favorite list not found');
    }
    return favoriteList;
  }

  /**
   * Adds a product to the favorite list of a company.
   *
   * @param companyId - The UUID of the company.
   * @param productId - The UUID of the product.
   * @returns A promise that resolves to the updated FavoriteList.
   * @throws {Error} If the company or product is not found.
   * @throws {ConflictException} If the product is already in the favorite list.
   */
  async addProduct(companyId: UUID, productId: UUID): Promise<FavoriteList> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!company || !product) {
      throw new Error('Company or Product not found');
    }

    let favoriteList = await this.favoriteListRepository.findOne({
      where: { company: { id: company.id } },
      relations: ['products'], // Ensure products relation is loaded
    });

    if (!favoriteList) {
      favoriteList = this.favoriteListRepository.create({
        company: company,
        products: [],
      });
    }

    // Check if the product is already in the favorites list
    const productExists = favoriteList.products.some(
      (p) => p.id === product.id,
    );
    if (!productExists) {
      favoriteList.products.push(product);
    } else {
      throw new ConflictException('Product already in favorite list');
    }
    this.logger.log(
      `FavoriteList products after adding: ${JSON.stringify(
        favoriteList.products,
      )}`,
    );

    return await this.favoriteListRepository.save(favoriteList);
  }

  /**
   * Removes a product from the favorite list of a company.
   *
   * @param {UUID} companyId - The ID of the company.
   * @param {UUID} productId - The ID of the product to be removed.
   * @returns {Promise<FavoriteList>} - The updated favorite list after the product has been removed.
   * @throws {NotFoundException} - If the company or product is not found.
   * @throws {Error} - If an error occurs during the process.
   */
  async removeProduct(companyId: UUID, productId: UUID): Promise<FavoriteList> {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!company || !product) {
        throw new NotFoundException('Company or Product not found');
      }

      const favoriteList = await this.favoriteListRepository.findOne({
        where: { company: { id: company.id } },
        relations: ['products'], // Ensure products relation is loaded
      });
      if (!favoriteList) {
        return null;
      }

      favoriteList.products = favoriteList.products.filter(
        (p) => p.id !== productId,
      );
      const newFavorites = await this.favoriteListRepository.save(favoriteList);
      return newFavorites;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

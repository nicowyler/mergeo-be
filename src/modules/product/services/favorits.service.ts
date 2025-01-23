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
}

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async addProduct(companyId: UUID, productId: UUID): Promise<BlackList> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['products'],
    });
    const product = company.products.find((p) => p.id === productId);

    if (!company || !product) {
      throw new Error('Company or Product not found');
    }

    let blacklist = await this.blackListRepository.findOne({
      where: { company: { id: company.id } },
      relations: ['products'],
    });

    if (!blacklist) {
      blacklist = this.blackListRepository.create({
        company: company,
        products: [],
      });
    }

    // Check if the product is already in the blacklist
    const productExists = blacklist.products.some((p) => p.id === product.id);
    if (!productExists) {
      // Remove the product from the favorites list if it exists
      this.favoritesService.removeProduct(companyId, productId);
      blacklist.products.push(product);
    } else {
      throw new ConflictException('Product already in blacklist');
    }
    this.logger.log(
      `blacklist products after adding: ${JSON.stringify(blacklist.products)}`,
    );

    return await this.blackListRepository.save(blacklist);
  }

  async removeProduct(companyId: UUID, productId: UUID): Promise<BlackList> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!company || !product) {
      throw new Error('Company or Product not found');
    }

    const blacklist = await this.blackListRepository.findOne({
      where: { company: { id: company.id } },
      relations: ['products'], // Ensure products relation is loaded
    });
    if (!blacklist) {
      throw new Error('blacklist list not found');
    }

    blacklist.products = blacklist.products.filter((p) => p.id !== productId);
    const newFavorites = await this.blackListRepository.save(blacklist);
    return newFavorites;
  }

  async addMultipleProducts(
    companyId: UUID,
    products: Product[],
  ): Promise<BlackList> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    let blackList = await this.blackListRepository.findOne({
      where: { company: { id: company.id } },
      relations: ['products'], // Ensure products relation is loaded
    });

    if (!blackList) {
      blackList = this.blackListRepository.create({
        company: company,
        products: [],
      });
    }

    // Add products to the blacklist if they are not already present
    products.forEach((product) => {
      if (!blackList.products.some((p) => p.id === product.id)) {
        blackList.products.push(product);
      }
    });

    return await this.blackListRepository.save(blackList);
  }

  // remove multiple products from blacklist
  async removeMultipleProducts(
    companyId: UUID,
    clientProducts: Product[],
  ): Promise<BlackList> {
    const blackList = await this.blackListRepository.findOne({
      where: { company: { id: companyId } },
      relations: ['products'],
    });

    if (!blackList) {
      throw new Error('Black list not found');
    }

    // Remove products from the blacklist
    blackList.products = blackList.products.filter(
      (product) => !clientProducts.includes(product),
    );

    this.logger.log(`Removing products from blacklist: ${blackList.products}`);

    return await this.blackListRepository.save(blackList);
  }

  async find(companyId: UUID): Promise<BlackList> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new Error('Company not found');
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
}

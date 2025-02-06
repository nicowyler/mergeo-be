import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GenericFilter } from 'src/common/pagination/generic.filter';
import { PageService } from 'src/common/pagination/page.service';
import { ProviderSearchPrdoucDto } from 'src/modules/product/dto/provider-search-products.dto';
import { Product } from 'src/modules/product/entities/product.entity';
import { Repository, FindOptionsWhere, Raw } from 'typeorm';

@Injectable()
export class PaginatedProductsService extends PageService {
  private readonly logger = new Logger(PaginatedProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {
    super();
  }

  async findAllPaginated(filter: ProviderSearchPrdoucDto & GenericFilter) {
    const {
      page = 1,
      pageSize = 10,
      orderBy,
      sortOrder,
      companyId,
      ...params
    } = filter;
    this.logger.debug(`Pagination params: page=${page}, pageSize=${pageSize}`);

    // Ensure companyId is always included
    if (!companyId) {
      throw new Error('Company ID is required for filtering products.');
    }

    const where: FindOptionsWhere<Product> = this.createWhereQuery({
      companyId,
      ...params,
    });

    // Debug logging
    this.logger.debug('Where condition:', where);

    const [products, total] = await this.paginate(
      this.productRepository,
      { page, pageSize, orderBy, sortOrder },
      where,
    );

    // Debug logging
    this.logger.debug(
      `Found ${products.length} products out of ${total} total`,
    );

    return {
      products,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  }

  private createWhereQuery(
    params: ProviderSearchPrdoucDto,
  ): FindOptionsWhere<Product> {
    try {
      const where: FindOptionsWhere<Product> = {
        company: { id: params.companyId },
      };

      if (params.name) {
        where.name = Raw(
          (alias) => `UPPER(UNACCENT(${alias})) LIKE UPPER(UNACCENT(:value))`,
          { value: `%${params.name}%` },
        );
      }

      if (params.brand) {
        where.brand = Raw(
          (alias) => `UPPER(UNACCENT(${alias})) LIKE UPPER(UNACCENT(:value))`,
          { value: `%${params.brand}%` },
        );
      }

      return where;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Error creating where query');
    }
  }
}

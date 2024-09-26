import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SearchList } from 'src/modules/searchList/searchList.entity';
import { SearchListProduct } from 'src/modules/searchList/searchListProduct.entity';
import { UUID } from 'crypto';
import {
  CreateProductDto,
  CreateSearchListDto,
  UpdateProductDto,
  UpdateSearchListDto,
} from 'src/modules/searchList/searchList.dto';
import { ErrorMessages } from 'src/common/enum';

@Injectable()
export class SearchListService {
  constructor(
    @InjectRepository(SearchList)
    private readonly searchListRepository: Repository<SearchList>,

    @InjectRepository(SearchListProduct)
    private readonly searchListProductRepository: Repository<SearchListProduct>,
  ) {}

  // Create a new SearchList with products
  async create(companyId: UUID, dto: CreateSearchListDto): Promise<SearchList> {
    try {
      const { name, createdBy, products } = dto;

      // Create a new SearchList entity
      const searchList = this.searchListRepository.create({
        name,
        companyId,
        createdBy,
        products: [],
      });

      // Find existing products by their names or create new ones
      for (const productDto of products) {
        let product = await this.searchListProductRepository.findOne({
          where: { name: productDto.name },
        });

        if (!product) {
          // If product does not exist, create it
          product = this.searchListProductRepository.create({
            name: productDto.name,
            category: productDto.category,
          });

          // Save the new product
          await this.searchListProductRepository.save(product);
        }

        // Add the product to the list (Many-to-Many relation)
        searchList.products.push(product);
      }

      // Save the search list with associated products
      return await this.searchListRepository.save(searchList);
    } catch (error) {
      if (error && error.constraint === 'UQ_LIST_NAME') {
        throw new ConflictException(ErrorMessages.SEARCH_LIST_NAME_TAKEN);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  // Fetch all search lists
  async findAll(companyId: UUID): Promise<SearchList[]> {
    return await this.searchListRepository.find({
      where: { companyId },
      relations: ['products'],
    });
  }

  // Find a search list by ID
  async findOne(id: UUID): Promise<SearchList> {
    const searchList = await this.searchListRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!searchList) {
      throw new NotFoundException(`SearchList with ID ${id} not found`);
    }

    return searchList;
  }

  // Update a SearchList
  async update(
    id: UUID,
    updateSearchListDto: UpdateSearchListDto,
  ): Promise<SearchList> {
    const searchList = await this.findOne(id);

    // Update basic fields of the SearchList
    Object.assign(searchList, updateSearchListDto);

    if (updateSearchListDto.products) {
      const productNames = updateSearchListDto.products.map(
        (product) => product.name,
      );

      // Find existing products by name
      const existingProducts = await this.searchListProductRepository.find({
        where: { name: In(productNames) },
      });

      // Create a map for the existing products by name
      const existingProductsMap = new Map(
        existingProducts.map((product) => [product.name, product]),
      );

      // Prepare the updated products array
      const updatedProducts = await Promise.all(
        updateSearchListDto.products.map(async (productDto) => {
          const existingProduct = existingProductsMap.get(productDto.name);

          if (existingProduct) {
            // If product exists, return it
            return existingProduct;
          }

          // If product doesn't exist, create and save a new one
          const newProduct =
            this.searchListProductRepository.create(productDto);
          return await this.searchListProductRepository.save(newProduct);
        }),
      );

      // Set the updated products to the search list
      searchList.products = updatedProducts;
    }

    // Save the updated search list with its products
    return await this.searchListRepository.save(searchList);
  }

  // Delete a SearchList
  async deleteSearchList(listId: UUID): Promise<void> {
    const searchList = await this.searchListRepository.findOne({
      where: { id: listId },
      relations: ['products'],
    });

    if (!searchList) {
      throw new NotFoundException(`Search list with ID ${listId} not found`);
    }

    // Detach the products from the search list before removing it
    searchList.products = [];
    await this.searchListRepository.save(searchList);

    // Now remove the search list
    await this.searchListRepository.remove(searchList);

    // Check if the products are used in any other search lists and remove if not
    for (const product of searchList.products) {
      const productUsageCount = await this.searchListRepository.count({
        where: { products: { id: product.id } },
      });

      if (productUsageCount === 0) {
        // If no other search list uses this product, remove it
        await this.searchListProductRepository.remove(product);
      }
    }
  }

  // ************************
  //       PRODUCTS
  // ************************
  // Add a product to a search list
  async addProductToList(
    listId: UUID,
    createProductDto: CreateProductDto[],
  ): Promise<SearchListProduct[]> {
    const searchList = await this.searchListRepository.findOne({
      where: { id: listId },
      relations: ['products'],
    });

    if (!searchList) {
      throw new NotFoundException(`Search list with ID ${listId} not found`);
    }

    const addedProducts: SearchListProduct[] = [];

    for (const dto of createProductDto) {
      // Check if the product already exists
      let product = await this.searchListProductRepository.findOne({
        where: { name: dto.name },
      });

      if (!product) {
        // If the product doesn't exist, create it
        product = this.searchListProductRepository.create(dto);
        await this.searchListProductRepository.save(product);
      }

      // Add the product to the list if it's not already present
      if (!searchList.products.some((p) => p.id === product.id)) {
        searchList.products.push(product);
        addedProducts.push(product);
      }
    }

    // Save the updated search list
    await this.searchListRepository.save(searchList);

    return addedProducts; // Return the array of added products
  }

  // Update a product in a search list
  async updateProduct(
    productId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<SearchListProduct> {
    const product = await this.searchListProductRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    Object.assign(product, updateProductDto);

    return await this.searchListProductRepository.save(product);
  }

  // Remove a product from a search list
  async removeProductFromList(listId: UUID, productId: UUID): Promise<void> {
    const searchList = await this.searchListRepository.findOne({
      where: { id: listId },
      relations: ['products'],
    });

    if (!searchList) {
      throw new NotFoundException(`Search list with ID ${listId} not found`);
    }

    // Remove the product from the list
    searchList.products = searchList.products.filter(
      (product) => product.id !== productId,
    );
    await this.searchListRepository.save(searchList);

    // Check if the product is used in any other search lists
    const productUsageCount = await this.searchListRepository.count({
      where: { products: { id: productId } },
    });

    if (productUsageCount === 0) {
      // If no other search list uses this product, delete it
      const product = await this.searchListProductRepository.findOne({
        where: { id: productId },
      });

      if (product) {
        await this.searchListProductRepository.remove(product);
      }
    }
  }
}

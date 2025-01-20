import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Logger,
  UnsupportedMediaTypeException,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './services/product.service';
import { SearchProductsDto } from 'src/modules/product/dto/search-products.dto';
import { UUID } from 'crypto';
import {
  CreateProductsListDto,
  UpdateProductsListDto,
} from 'src/modules/product/dto/create-productsList.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xlsx from 'xlsx';
import { GtinProductDto } from 'src/modules/product/dto/gtinProduct.dto';
import { ProductQueueService } from 'src/modules/product/product.queue';
import { Product } from 'src/modules/product/entities/product.entity';
import { Gs1Service } from 'src/modules/gs1/gs1.service';
import { PrdouctInlistDto } from 'src/modules/product/dto/prdouct-in-list.dto';
import { TransformInterceptor } from 'src/interceptors/response.interceptor';
import { ResponseMessage } from 'src/decorators/response_message.decorator';
import { FavoritesService } from 'src/modules/product/services/favorits.service';
import { BlackListService } from 'src/modules/product/services/blacklist.service';
import { ProductsListService } from 'src/modules/product/services/lists.service';
import { ProductList } from 'src/modules/product/entities/product-list.entity';

@Controller('/product')
@UseInterceptors(TransformInterceptor)
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly productService: ProductService,
    private readonly productsListsService: ProductsListService,
    private readonly favoritesService: FavoritesService,
    private readonly blackListService: BlackListService,
    private readonly productQueueService: ProductQueueService,
    private readonly gs1Service: Gs1Service,
  ) {}

  /** ################### PRODUCTS ###################*/
  /**
   * PROVIDER PRODUCTS SEARCH
   * Searches for products by GS1 code.
   *
   * @param companyId - The UUID of the company.
   * @param productSearch - The product search criteria.
   * @returns The search results from the product service.
   */
  @Get('/search/:companyId')
  searchProductsByGS1(
    @Param('companyId') companyId: UUID,
    @Query() productSearch: PrdouctInlistDto,
  ) {
    this.logger.log('GS1 search hit', productSearch);
    return this.productService.searchProduct(companyId, productSearch);
  }

  /**
   * CLIENT SEARCH PRODUCTS
   * Searches for products based on the provided company ID and search criteria.
   *
   * @param {string} companyId - The ID of the company to search products for.
   * @param {SearchProductsDto} searchProductsDto - The DTO containing search criteria for products.
   * @returns {Promise<Product[]>} A promise that resolves to an array of products matching the search criteria.
   */
  @Get(':companyId')
  searchProducts(
    @Param('companyId') companyId: string,
    @Query() searchProductsDto: SearchProductsDto,
  ): Promise<{ count: number; products: Product[] }> {
    return this.productService.searchProducts(companyId, searchProductsDto);
  }

  /**
   * GET NET CONTENTS
   * Retrieves the net contents along with their prices for a given product.
   *
   * @param {UUID} productId - The unique identifier of the product.
   * @returns {Promise<Product[]>} A promise that resolves to the net contents and their prices.
   */
  @ResponseMessage('Productos obtenidos con exito!')
  @Get('/net-contents/:productId')
  async getNetContentsWithPrices(@Param('productId') productId: UUID) {
    return this.productService.getNetContentsWithPrices(productId);
  }

  /**
   * ADD SINGLE PRODUCT
   * Adds a single product to the specified company.
   *
   * @param companyId - The UUID of the company to which the product will be added.
   * @param product - The product data transfer object containing the GTIN and other product details.
   * @returns A promise that resolves to the added product.
   */
  @Post('/add/:companyId/')
  @UseInterceptors(FileInterceptor('file'))
  async addSingleProduct(
    @Param('companyId') companyId: UUID,
    @Body() product: GtinProductDto,
  ): Promise<Product> {
    const productData = await this.gs1Service.getProductByGTIN(product.gtin);
    productData.price = product.price;
    return await this.productService.addProduct(productData, companyId);
  }

  /**
   * UPLOAD PRODUCTS WITH EXCEL FILE
   * Uploads products from an Excel file and adds them to a processing queue.
   *
   * @param companyId - The UUID of the company to which the products belong.
   * @param file - The uploaded Excel file containing product data.
   * @returns A promise that resolves when the products have been added to the queue.
   * @throws UnsupportedMediaTypeException - If the uploaded file doesn't contain any products.
   * @throws Error - If there is an error during the upload process.
   */
  @Post('/upload/:companyId/')
  @ResponseMessage('Productos agregados a la cola con exito!')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductsFromExcel(
    @Param('companyId') companyId: UUID,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    try {
      if (!file) {
        throw new BadRequestException('File is not provided');
      }
      // Read the uploaded Excel file
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convert the sheet to JSON
      // Get the headers and convert them to lowercase
      const headers = (
        xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[]
      ).map((header: string) => {
        header = header.toLowerCase();
        if (header === 'ean') return 'gtin';
        if (header === 'precio') return 'price';
        return header;
      });

      // Convert the sheet to JSON with lowercase headers
      const products: GtinProductDto[] = xlsx.utils.sheet_to_json(worksheet, {
        header: headers,
        range: 1,
      });

      if (products.length === 0) {
        throw new UnsupportedMediaTypeException(
          "The uploaded file doesn't contain any products",
        );
      }

      // Add products to queue for processing
      const params = {
        products,
        companyId,
      };
      await this.productQueueService.addProductsToQueue(params);
    } catch (error) {
      this.logger.error('Error uploading products:', error);
      throw error;
    }
  }

  /** ################### PRODUCTS LISTS ###################*/
  /**
   * Creates a new list of products for the specified company.
   * This is used to add a discounts to products in the list
   *
   * @param companyId - The UUID of the company for which the product list is being created.
   * @param body - The data transfer object containing the details of the products list to be created.
   * @returns A promise that resolves to the created products list.
   */
  @Post('/lists/:companyId')
  async createList(
    @Param('companyId') companyId: UUID,
    @Body() body: CreateProductsListDto,
  ) {
    return this.productsListsService.createList(companyId, body);
  }

  /**
   * Retrieves the lists of products for a given company.
   *
   * @param companyId - The UUID of the company whose product lists are to be retrieved.
   * @returns A promise that resolves to the product lists of the specified company.
   */
  @Get('/lists/:companyId')
  @ResponseMessage('Listas encontradas!')
  findLists(@Param('companyId') companyId: UUID) {
    return this.productsListsService.getLists(companyId);
  }

  /**
   * Retrieves the products from a specified list.
   *
   * @param listId - The UUID of the list from which to retrieve products.
   * @returns A promise that resolves to the products in the specified list.
   */
  @Get('/list/:listId')
  findProductsInList(@Param('listId') listId: UUID) {
    return this.productsListsService.getProductsFromList(listId);
  }

  /**
   * Edits a product list with the given list ID and update data.
   *
   * @param listId - The UUID of the product list to be edited.
   * @param body - description and/or discount
   * @returns The updated product list.
   */
  @Patch('/list/:listId')
  editList(@Param('listId') listId: UUID, @Body() body: UpdateProductsListDto) {
    return this.productsListsService.editList(listId, body);
  }

  /**
   * Adds a list of products to a specified product list.
   *
   * @param listId - The UUID of the product list to which the products will be added.
   * @param products - An array of products to be added to the list.
   * @returns A promise that resolves when the products have been added to the list.
   */
  @Post('/list/:listId/add')
  addProductToList(@Param('listId') listId: UUID, @Body() products: Product[]) {
    return this.productsListsService.addProducts(listId, products);
  }

  /**
   * Removes a list of products from a specified list.
   *
   * @param {UUID} listId - The unique identifier of the list from which products will be removed.
   * @param {UUID[]} productsId - An array of unique identifiers of the products to be removed from the list.
   * @returns {Promise<ProductList>} - A promise that resolves when the products have been successfully removed from the list.
   */
  @Post('/list/:listId/remove')
  removeProductFromList(
    @Param('listId') listId: UUID,
    @Body() productsId: UUID[],
  ): Promise<ProductList> {
    return this.productsListsService.removeProducts(listId, productsId);
  }

  /** ################### FAVORITE LISTS ###################*/
  /**
   * Retrieves the list of favorite items for a given company.
   *
   * @param companyId - The UUID of the company whose favorite list is to be retrieved.
   * @returns A promise that resolves to the list of favorite items for the specified company.
   */
  @ResponseMessage('Lista de favoritos encontrada con exito!')
  @Get('/favorite/:companyId')
  getFavoritList(@Param('companyId') companyId: UUID) {
    return this.favoritesService.find(companyId);
  }

  /**
   * Adds a product to the favorite list of a company.
   *
   * @param companyId - The UUID of the company.
   * @param productId - The UUID of the product.
   * @returns A promise that resolves when the product has been added to the favorite list.
   */
  @Post('/favorite/:companyId/:productId')
  addProductToFavoriteList(
    @Param('companyId') companyId: UUID,
    @Param('productId') productId: UUID,
  ) {
    return this.favoritesService.addProduct(companyId, productId);
  }

  /**
   * Removes a product from the favorite list of a company.
   *
   * @param companyId - The UUID of the company.
   * @param productId - The UUID of the product to be removed from the favorite list.
   * @returns A promise that resolves when the product is removed from the favorite list.
   */
  @Post('/favorite/:companyId/:productId/remove')
  removeProductFromFavoriteList(
    @Param('companyId') companyId: UUID,
    @Param('productId') productId: UUID,
  ) {
    return this.favoritesService.removeProduct(companyId, productId);
  }

  /** ################### BLACK LISTS ###################*/
  /**
   * Retrieves the blacklist for a given company.
   *
   * @param companyId - The UUID of the company whose blacklist is to be retrieved.
   * @returns A promise that resolves to the blacklist of the specified company.
   */
  @ResponseMessage('Lista negra encontrada con exito!')
  @Get('/blacklist/:companyId')
  getBlacklist(@Param('companyId') companyId: UUID) {
    return this.blackListService.find(companyId);
  }

  /**
   * Adds a product to the blacklist for a specific company.
   *
   * @param companyId - The UUID of the company.
   * @param productId - The UUID of the product to be blacklisted.
   * @returns A promise that resolves when the product has been added to the blacklist.
   */
  @ResponseMessage('Producto agregado a la lista negra!')
  @Post('/blacklist/:companyId/:productId')
  addProductToBlacklist(
    @Param('companyId') companyId: UUID,
    @Param('productId') productId: UUID,
  ) {
    return this.blackListService.addProduct(companyId, productId);
  }

  /**
   * Removes a product from the blacklist for a given company.
   *
   * @param companyId - The UUID of the company.
   * @param productId - The UUID of the product to be removed from the blacklist.
   * @returns A promise that resolves when the product is removed from the blacklist.
   */
  @ResponseMessage('Producto removido de la lista negra!')
  @Post('/blacklist/:companyId/:productId/remove')
  removeProductFromBlacklist(
    @Param('companyId') companyId: UUID,
    @Param('productId') productId: UUID,
  ) {
    return this.blackListService.removeProduct(companyId, productId);
  }
}

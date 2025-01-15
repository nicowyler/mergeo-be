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
} from '@nestjs/common';
import { ProductService } from './services/product.service';
import { SearchProductsDto } from 'src/modules/product/dto/search-products.dto';
import { UUID } from 'crypto';
import { CreateProductsListDto } from 'src/modules/product/dto/create-productsList.dto';
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

@Controller('/product')
@UseInterceptors(TransformInterceptor)
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly productService: ProductService,
    private readonly favoritesService: FavoritesService,
    private readonly blackListService: BlackListService,
    private readonly productQueueService: ProductQueueService,
    private readonly gs1Service: Gs1Service,
  ) {}

  // GS1 PRODUCTS SEARCH
  @Get('/search/:companyId')
  searchProductsByGS1(
    @Param('companyId') companyId: UUID,
    @Query() productSearch: PrdouctInlistDto,
  ) {
    this.logger.log('GS1 search hit', productSearch);
    return this.productService.searchProduct(companyId, productSearch);
  }

  @Post('/add/:companyId/:listId?')
  @UseInterceptors(FileInterceptor('file'))
  async addSingleProduct(
    @Param('companyId') companyId: UUID,
    @Param('listId') listId: UUID | null = null,
    @Body() product: GtinProductDto,
  ): Promise<Product> {
    // Add a singleproduct

    const productData = await this.gs1Service.getProductByGTIN(product.gtin);
    productData.price = product.price;
    return await this.productService.addProduct(productData, companyId, listId);
  }

  // UPLOAD PRODUCTS WITH EXCEL FILE
  @Post('/upload/:companyId/:listId?')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductsFromExcel(
    @Param('companyId') companyId: UUID,
    @Param('listId') listId: UUID | null = null,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    // Read the uploaded Excel file
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert the sheet to JSON
    const products: GtinProductDto[] = xlsx.utils.sheet_to_json(worksheet);

    // Add products to queue for processing
    const params = {
      products,
      companyId,
      listId,
    };
    await this.productQueueService.addProductsToQueue(params);
  }

  // PRODUCTS LISTS
  @Post('/lists')
  async createList(@Body() body: CreateProductsListDto) {
    return this.productService.createList(body);
  }

  @Get('/lists/:listId')
  findProductsInList(@Param('listId') listId: UUID) {
    return this.productService.getProductsFromList(listId);
  }

  @Get('/company/:companyId/lists')
  findLists(@Param('companyId') companyId: UUID) {
    return this.productService.getLists(companyId);
  }

  // PRODUCTS
  @Get(':companyId')
  searchProducts(
    @Param('companyId') companyId: string,
    @Query() searchProductsDto: SearchProductsDto,
  ) {
    return this.productService.searchProducts(companyId, searchProductsDto);
  }

  // gets the net contents of a product with the prices
  @Get('/net-contents/:productId')
  async getNetContentsWithPrices(@Param('productId') productId: UUID) {
    return this.productService.getNetContentsWithPrices(productId);
  }

  // FAVORITE LISTS
  // Find the favorite list of a company
  @ResponseMessage('Lista de favoritos encontrada con exito!')
  @Get('/favorite/:companyId')
  getFavoritList(@Param('companyId') companyId: UUID) {
    return this.favoritesService.find(companyId);
  }

  // Add a product to the favorite list
  @Post('/favorite/:companyId/:productId')
  addProductToFavoriteList(
    @Param('companyId') companyId: UUID,
    @Param('productId') productId: UUID,
  ) {
    return this.favoritesService.addProduct(companyId, productId);
  }

  // Remove a product from the favorite list
  @Post('/favorite/:companyId/:productId/remove')
  removeProductFromFavoriteList(
    @Param('companyId') companyId: UUID,
    @Param('productId') productId: UUID,
  ) {
    return this.favoritesService.removeProduct(companyId, productId);
  }

  // BLACK LISTS
  // Find the black list of a company
  @ResponseMessage('Lista negra encontrada con exito!')
  @Get('/blacklist/:companyId')
  getBlacklist(@Param('companyId') companyId: UUID) {
    return this.blackListService.find(companyId);
  }

  // Add a product to the favorite list
  @ResponseMessage('Producto agregado a la lista negra!')
  @Post('/blacklist/:companyId/:productId')
  addProductToBlacklist(
    @Param('companyId') companyId: UUID,
    @Param('productId') productId: UUID,
  ) {
    return this.blackListService.addProduct(companyId, productId);
  }

  // Remove a product from the favorite list
  @ResponseMessage('Producto removido de la lista negra!')
  @Post('/blacklist/:companyId/:productId/remove')
  removeProductFromBlacklist(
    @Param('companyId') companyId: UUID,
    @Param('productId') productId: UUID,
  ) {
    return this.blackListService.removeProduct(companyId, productId);
  }
}

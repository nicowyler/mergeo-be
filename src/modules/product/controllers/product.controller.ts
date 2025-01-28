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
  BadRequestException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { SearchProductsDto } from 'src/modules/product/dto/search-products.dto';
import { UUID } from 'crypto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xlsx from 'xlsx';
import { GtinProductDto } from 'src/modules/product/dto/gtinProduct.dto';
import { ProductQueueService } from 'src/modules/product/queue/product.queue.service';
import { Product } from 'src/modules/product/entities/product.entity';
import { Gs1Service } from 'src/modules/gs1/gs1.service';
import { PrdouctInlistDto } from 'src/modules/product/dto/prdouct-in-list.dto';
import { TransformInterceptor } from 'src/interceptors/response.interceptor';
import { ResponseMessage } from 'src/decorators/response_message.decorator';
import { AuthGuard } from 'src/guards';
import { RequestUserDto } from 'src/modules/auth/dto/auth.dto';
import { ProductMetadataDto } from 'src/modules/product/dto/product-metadata.dto';
import { ApiResponse } from '@nestjs/swagger';
import { ProviderSearchPrdoucDto } from 'src/modules/product/dto/provider-search-products.dto';

@Controller('/product')
@UseInterceptors(TransformInterceptor)
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(
    private readonly productService: ProductService,
    private readonly productQueueService: ProductQueueService,
    private readonly gs1Service: Gs1Service,
  ) {}

  /** ################### PRODUCTS ###################*/
  /**
   * PROVIDER PRODUCTS SEARCH
   * Searches for products without taking into account the company.
   *
   * @param companyId - The UUID of the company.
   * @param productSearch - The product search criteria.
   * @returns The search results from the product service.
   */
  @Get('/search/')
  async searchProviderProducts(
    @Query() productSearch: ProviderSearchPrdoucDto,
  ) {
    this.logger.log('searching for product', productSearch);
    const products = await this.productService.searchProviderProducts(
      productSearch,
    );
    return { products, count: products.length };
  }

  /**
   * PROVIDER PRODUCTS SEARCH
   * Searches for products in company inventory.
   *
   * @param companyId - The UUID of the company.
   * @param productSearch - The product search criteria.
   * @returns The search results from the product service.
   */
  @Get('/search/:companyId')
  searchProductInInventory(
    @Param('companyId') companyId: UUID,
    @Query() productSearch: ProviderSearchPrdoucDto,
  ) {
    this.logger.log('searching for product', productSearch);
    return this.productService.searchProductInInventory(
      companyId,
      productSearch,
    );
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
  @UseGuards(AuthGuard)
  async addSingleProduct(
    @Param('companyId') companyId: UUID,
    @Body() products: GtinProductDto[],
    @Request() req: RequestUserDto,
  ): Promise<Product[]> {
    const userId = req.user.id as UUID;
    const addedProducts = await this.productService.addMultipleProducts(
      products,
      userId,
      companyId,
    );

    return addedProducts;
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
  @UseGuards(AuthGuard)
  async uploadProductsFromExcel(
    @Param('companyId') companyId: UUID,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestUserDto,
  ): Promise<void> {
    try {
      const user = req.user;

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
        userId: user.id as UUID,
        companyId,
        fileName: file.originalname,
      };
      await this.productQueueService.addProductsToQueue(params);
    } catch (error) {
      this.logger.error('Error uploading products:', error);
      throw error;
    }
  }

  @Get('/metadata/:productId/')
  @UseGuards(AuthGuard)
  @ApiResponse({ type: ProductMetadataDto })
  async getProductMetadata(
    @Param('productId') productId: UUID,
  ): Promise<ProductMetadataDto> {
    const productMetadata = await this.productService.getProductMetadata(
      productId,
    );
    return productMetadata;
  }
}

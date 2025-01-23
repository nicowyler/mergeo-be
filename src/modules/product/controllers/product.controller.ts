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
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto } from 'src/modules/product/dto/search-products.dto';
import { UUID } from 'crypto';
import { CreateProductsListDto } from 'src/modules/product/dto/create-productsList.dto';
import { Gs1SearchProductsDto } from 'src/modules/product/dto/gs1-search.dto';

@Controller('/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // GS1 PRODUCTS SEARCH
  @Get('/gs1')
  searchProductsByGS1(@Query() gs1Search: Gs1SearchProductsDto) {
    console.log('GS1 search hit', gs1Search);
    return this.productService.searchProductsByGS1(gs1Search);
  }

  // PRODUCTS LISTS
  @Post('/lists')
  async createList(@Body() body: CreateProductsListDto) {
    return this.productService.createList(body);
  }

  @Get('/lists/:companyId')
  findLists(@Param('companyId') companyId: UUID) {
    return this.productService.findLists(companyId);
  }

  // PRODUCTS
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }

  @Get(':companyId')
  searchProducts(
    @Param('companyId') companyId: string,
    @Query() searchProductsDto: SearchProductsDto, // Use @Query() to extract query parameters
  ) {
    return this.productService.searchProducts(companyId, searchProductsDto);
  }
}

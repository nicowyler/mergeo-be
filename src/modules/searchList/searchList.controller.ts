import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SearchListService } from './searchList.service';
import { TransformInterceptor } from '../../interceptors/response.interceptor';
import { ResponseMessage } from '../../decorators/response_message.decorator';
import { AuthGuard } from '../../guards';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateProductDto,
  CreateSearchListDto,
  UpdateProductDto,
  UpdateSearchListDto,
} from 'src/modules/searchList/searchList.dto';
import { SearchList } from 'src/modules/searchList/searchList.entity';
import { UUID } from 'crypto';
import { SearchListProduct } from 'src/modules/searchList/searchListProduct.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import * as xlsx from 'xlsx';
import * as fs from 'fs';

@ApiTags('Lists')
@UseInterceptors(TransformInterceptor)
@Controller('searchLists')
export class SearchListController {
  constructor(private readonly searchListService: SearchListService) {}

  @Post(':companyId')
  @UseGuards(AuthGuard)
  @ResponseMessage('Lista de Busqueda creada con exito!')
  async create(
    @Param('companyId', new ParseUUIDPipe()) companyId: UUID,
    @Body() body: CreateSearchListDto,
  ): Promise<SearchList> {
    return await this.searchListService.create(companyId, body);
  }

  @Patch('list/:id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Lista de Busqueda actualizado con exito!')
  async update(
    @Param('id', new ParseUUIDPipe()) id: UUID,
    @Body() body: UpdateSearchListDto,
  ): Promise<SearchList> {
    return await this.searchListService.update(id, body);
  }

  @Get(':companyId')
  @UseGuards(AuthGuard)
  @ResponseMessage('Listas de Busqueda encontradas con exito!')
  async get(
    @Param('companyId', new ParseUUIDPipe()) companyId: UUID,
  ): Promise<SearchList[]> {
    return await this.searchListService.findAll(companyId);
  }

  @Get('list/:id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Lista de Busqueda encontrada con exito!')
  async getById(
    @Param('id', new ParseUUIDPipe()) id: UUID,
  ): Promise<SearchList> {
    return await this.searchListService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ResponseMessage('Listas de Busqueda borrada con exito!')
  async delete(@Param('id', new ParseUUIDPipe()) id: UUID): Promise<void> {
    return await this.searchListService.deleteSearchList(id);
  }

  // UPLOAD PRODUCTS WITH EXCEL FILE
  @Post(':listId/products/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductsFromExcel(
    @Param('listId') listId: UUID,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    // Read the uploaded Excel file
    const workbook = xlsx.readFile(file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convert the sheet to JSON
    const products: CreateProductDto[] = xlsx.utils.sheet_to_json(worksheet);

    // Remove the uploaded file
    fs.unlinkSync(file.path);

    // Add products to the list
    for (const productDto of products) {
      await this.searchListService.addProductToList(listId, productDto);
    }
  }

  // PRODDUCTS
  @Post(':listId/products')
  @ResponseMessage('El producto se agrego con exito!')
  async addProductToList(
    @Param('listId') listId: UUID,
    @Body() createProductDto: CreateProductDto,
  ): Promise<SearchListProduct> {
    return this.searchListService.addProductToList(listId, createProductDto);
  }

  // Endpoint to update a product in a search list
  @Put('products/:productId')
  @ResponseMessage('El producto se modifico con exito!')
  async updateProduct(
    @Param('productId') productId: UUID,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<SearchListProduct> {
    return this.searchListService.updateProduct(productId, updateProductDto);
  }

  // Endpoint to remove a product from a search list
  @Delete(':listId/products/:productId')
  @ResponseMessage('El producto se removio de la lista con exito!')
  async removeProductFromList(
    @Param('listId') listId: UUID,
    @Param('productId') productId: UUID,
  ): Promise<void> {
    return this.searchListService.removeProductFromList(listId, productId);
  }
}

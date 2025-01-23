import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  Logger,
  Patch,
} from '@nestjs/common';
import { UUID } from 'crypto';
import {
  CreateProductsListDto,
  UpdateProductsListDto,
} from 'src/modules/product/dto/create-productsList.dto';
import { Product } from 'src/modules/product/entities/product.entity';
import { TransformInterceptor } from 'src/interceptors/response.interceptor';
import { ResponseMessage } from 'src/decorators/response_message.decorator';
import { ProductList } from 'src/modules/product/entities/product-list.entity';
import { DiscountsListService } from 'src/modules/product/services/discountsLists.service';

@Controller('/product/discount-list')
@UseInterceptors(TransformInterceptor)
export class DiscountListsController {
  private readonly logger = new Logger(DiscountListsController.name);

  constructor(private readonly discountsListService: DiscountsListService) {}

  /** ################### DISCOUNT LISTS ###################*/
  /**
   * Creates a new list of products for the specified company.
   * This is used to add a discounts to products in the list
   *
   * @param companyId - The UUID of the company for which the product list is being created.
   * @param body - The data transfer object containing the details of the products list to be created.
   * @returns A promise that resolves to the created products list.
   */
  @Post('/:companyId')
  async createList(
    @Param('companyId') companyId: UUID,
    @Body() body: CreateProductsListDto,
  ) {
    return this.discountsListService.createList(companyId, body);
  }

  /**
   * Retrieves the lists of products for a given company.
   *
   * @param companyId - The UUID of the company whose product lists are to be retrieved.
   * @returns A promise that resolves to the product lists of the specified company.
   */
  @Get('/:companyId')
  @ResponseMessage('Listas encontradas!')
  findLists(@Param('companyId') companyId: UUID) {
    return this.discountsListService.getLists(companyId);
  }

  /**
   * Retrieves the products from a specified list.
   *
   * @param listId - The UUID of the list from which to retrieve products.
   * @returns A promise that resolves to the products in the specified list.
   */
  @Get('list/:listId')
  findProductsInList(@Param('listId') listId: UUID) {
    return this.discountsListService.getProductsFromList(listId);
  }

  /**
   * Adds companies to a discount list.
   *
   * @param listId - The UUID of the list from which to retrieve products.
   * @body companyIds - a list of UUID of companies.
   * @returns A promise that resolves to the products in the specified list.
   */
  @Post('add/companies/:listId')
  addCompaniesToList(
    @Param('listId') listId: UUID,
    @Body() companyIds: UUID[],
  ) {
    return this.discountsListService.addCompaniesToList(listId, companyIds);
  }

  /**
   * Removes companies to a discount list.
   *
   * @param listId - The UUID of the list from which to retrieve products.
   * @body companyIds - a list of UUID of companies.
   * @returns A promise that resolves to the products in the specified list.
   */
  @Post('remove/companies/:listId')
  removeCompaniesFromList(
    @Param('listId') listId: UUID,
    @Body() companyIds: UUID[],
  ) {
    return this.discountsListService.removeCompaniesFromList(
      listId,
      companyIds,
    );
  }

  /**
   * Edits a product list with the given list ID and update data.
   *
   * @param listId - The UUID of the product list to be edited.
   * @param body - description and/or discount
   * @returns The updated product list.
   */
  @Patch('/:listId')
  editList(@Param('listId') listId: UUID, @Body() body: UpdateProductsListDto) {
    return this.discountsListService.editList(listId, body);
  }

  /**
   * Adds a list of products to a specified product list.
   *
   * @param listId - The UUID of the product list to which the products will be added.
   * @param products - An array of products to be added to the list.
   * @returns A promise that resolves when the products have been added to the list.
   */
  @Post('/:listId/add-products')
  addProductToList(@Param('listId') listId: UUID, @Body() products: Product[]) {
    return this.discountsListService.addProducts(listId, products);
  }

  /**
   * Removes a list of products from a specified list.
   *
   * @param {UUID} listId - The unique identifier of the list from which products will be removed.
   * @param {UUID[]} productsId - An array of unique identifiers of the products to be removed from the list.
   * @returns {Promise<ProductList>} - A promise that resolves when the products have been successfully removed from the list.
   */
  @Post('/:listId/remove-products')
  removeProductFromList(
    @Param('listId') listId: UUID,
    @Body() productsId: UUID[],
  ): Promise<ProductList> {
    return this.discountsListService.removeProducts(listId, productsId);
  }
}

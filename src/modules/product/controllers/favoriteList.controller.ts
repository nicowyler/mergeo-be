import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { UUID } from 'crypto';
import { TransformInterceptor } from 'src/interceptors/response.interceptor';
import { ResponseMessage } from 'src/decorators/response_message.decorator';
import { FavoritesService } from 'src/modules/product/services/favorits.service';

@Controller('/product/favorite')
@UseInterceptors(TransformInterceptor)
export class FavoriteListController {
  private readonly logger = new Logger(FavoriteListController.name);

  constructor(private readonly favoritesService: FavoritesService) {}

  /** ################### FAVORITE LISTS ###################*/
  /**
   * Retrieves the list of favorite items for a given company.
   *
   * @param companyId - The UUID of the company whose favorite list is to be retrieved.
   * @returns A promise that resolves to the list of favorite items for the specified company.
   */
  @ResponseMessage('Lista de favoritos encontrada con exito!')
  @Get('/:companyId')
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
  @Post('/:companyId/:productId')
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
  @Post('/:companyId/:productId/remove')
  removeProductFromFavoriteList(
    @Param('companyId') companyId: UUID,
    @Param('productId') productId: UUID,
  ) {
    return this.favoritesService.removeProduct(companyId, productId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { UUID } from 'crypto';
import { TransformInterceptor } from 'src/interceptors/response.interceptor';
import { ResponseMessage } from 'src/decorators/response_message.decorator';
import { BlackListService } from 'src/modules/product/services/blacklist.service';

@Controller('/product/blacklist')
@UseInterceptors(TransformInterceptor)
export class BlackListController {
  private readonly logger = new Logger(BlackListController.name);

  constructor(private readonly blackListService: BlackListService) {}

  /** ################### BLACK LISTS ###################*/
  /**
   * Retrieves the blacklist for a given company.
   *
   * @param companyId - The UUID of the company whose blacklist is to be retrieved.
   * @returns A promise that resolves to the blacklist of the specified company.
   */
  @ResponseMessage('Lista negra encontrada con exito!')
  @Get('/:companyId')
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
  @Post('/:companyId/')
  addProductToBlacklist(
    @Param('companyId') companyId: UUID,
    @Body() productsId: UUID[],
  ) {
    return this.blackListService.addProducts(companyId, productsId);
  }

  /**
   * Removes a product from the blacklist for a given company.
   *
   * @param companyId - The UUID of the company.
   * @param productsId - The UUID of the product to be removed from the blacklist.
   * @returns A promise that resolves when the product is removed from the blacklist.
   */
  @ResponseMessage('Producto removido de la lista negra!')
  @Post('/:companyId/remove')
  removeProductFromBlacklist(
    @Param('companyId') companyId: UUID,
    @Body() productsId: UUID[],
  ) {
    return this.blackListService.removeProducts(companyId, productsId);
  }
}

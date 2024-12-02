import { IsArray } from 'class-validator';
import { UUID } from 'crypto';
import { Company } from 'src/modules/company/company.entity';
import { CartProductDto } from 'src/modules/pre-order/dto/create-pre-order.dto';
import { PreOrder } from 'src/modules/pre-order/entities/pre-order.entity';

export class CreateBuyOrderDto {
  client: Company;

  userId: UUID;

  provider: Company;

  @IsArray()
  acceptedProducts: CartProductDto[];

  preOrder: PreOrder;
}

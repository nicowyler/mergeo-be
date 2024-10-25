import { PartialType } from '@nestjs/swagger';
import { CreatePreOrderDto } from './create-pre-order.dto';

export class UpdatePreOrderDto extends PartialType(CreatePreOrderDto) {}

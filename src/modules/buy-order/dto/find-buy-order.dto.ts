import { Expose, Type, Transform } from 'class-transformer';
import { Product } from 'src/modules/product/entities/product.entity';

export class LocationDto {
  @Expose() coordinates: number[];
  @Expose() type: string;
}
export class AddressDto {
  @Expose() id: string;
  @Expose()
  @Type(() => LocationDto)
  location: LocationDto;

  @Expose() name: string;
  @Expose() email: string;
  @Expose() phoneNumber: string;
}

export class UserDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() email: string;
}

export class ClientDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() activity: string;
  @Expose() razonSocial: string;
  @Expose() cuit: string;

  @Expose()
  @Type(() => AddressDto)
  address: AddressDto;

  @Expose()
  @Type(() => AddressDto)
  deliveryAddress: AddressDto;

  @Expose()
  @Type(() => UserDto)
  user: UserDto;
}

export class ProviderDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() activity: string;
  @Expose() razonSocial: string;
  @Expose() cuit: string;

  @Expose()
  @Type(() => AddressDto)
  address: AddressDto;

  @Expose()
  @Type(() => UserDto)
  user: UserDto;
}

export class ProductDto {
  @Expose() id: string;
  @Expose() quantity: number;

  @Expose()
  @Type(() => Product)
  prduct: Product;
}

export class OrderDto {
  @Expose() id: string;
  @Expose() created: Date;
  @Expose() orderNumber: string;

  @Expose()
  @Type(() => ClientDto)
  client: ClientDto;

  @Expose()
  @Type(() => ProviderDto)
  provider: ProviderDto;

  @Expose()
  @Transform(({ obj }) =>
    obj.buyOrderProducts?.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      id: item.id,
    })),
  )
  products: ProductDto[];
}

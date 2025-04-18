import { Injectable } from '@nestjs/common';
import { Gs1ProductDto } from 'src/modules/product/dto/gs1-product.dto';
import { Product } from 'src/modules/product/entities/product.entity';
import { UnitService } from 'src/modules/product/services/unitsMapper.service';

@Injectable()
export class ProductMapper {
  constructor(private readonly unitMapper: UnitService) {}

  /**
   * Transforms a Gs1ProductDto object into a Partial<Product> entity.
   *
   * @param dto - The Gs1ProductDto object containing product data.
   * @returns A promise that resolves to a Partial<Product> entity.
   */
  async transformToEntity(
    dto: Gs1ProductDto | Product,
  ): Promise<Partial<Product>> {
    if (dto instanceof Product) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...dtoWithoutId } = dto;
      return dtoWithoutId;
    }
    return {
      gtin: dto.GTIN,
      name: dto.Descripcion || dto.DescripcionGTIN14 || 'Unknown Product',
      measurementUnit: await this.unitMapper.normalizeName(
        dto.UnidadMedida || 'kg',
      ),
      pricePerBaseUnit: null,
      unitConversionFactor: 1,
      price: dto.price || 0,
      description: dto.Descripcion,
      brand: dto.Marca || 'Unknown Brand',
      variety: dto.Variedad,
      netContent: dto.ContenidoNeto || null,
      segment: dto.Segmento,
      family: dto.Familia,
      image: dto.Imagen?.[0] || null,
      manufacturer_name: dto.RazonSocial,
      manufacturer_country: dto.PaisFabricacion,
      manufacturer_id: dto.CUIT,
    };
  }
}

import { IsOptional, IsString, IsNumber } from 'class-validator';

export class Gs1ProductDto {
  @IsString()
  @IsOptional()
  GTIN14: string;

  @IsString()
  @IsOptional()
  DescripcionGTIN14: string;

  @IsString()
  @IsOptional()
  UnidadesContenidas: string;

  @IsString()
  @IsOptional()
  EnvaseGTIN14: string;

  @IsString()
  GTIN: string;

  @IsString()
  @IsOptional()
  Descripcion: string;

  @IsString()
  @IsOptional()
  SubMarca: string;

  @IsString()
  @IsOptional()
  Marca: string;

  @IsString()
  @IsOptional()
  Variedad: string;

  @IsNumber()
  @IsOptional()
  ContenidoNeto: number;

  @IsString()
  @IsOptional()
  Envase: string;

  @IsString()
  @IsOptional()
  UnidadMedida: string;

  @IsString()
  @IsOptional()
  Segmento: string;

  @IsString()
  @IsOptional()
  Familia: string;

  @IsString()
  @IsOptional()
  Clase: string;

  @IsString()
  @IsOptional()
  Ladrillo: string;

  @IsString()
  @IsOptional()
  CodigoInterno: string;

  @IsString()
  @IsOptional()
  PaisFabricacion: string;

  @IsString()
  @IsOptional()
  RazonSocial: string;

  @IsString()
  @IsOptional()
  CUIT: string;

  @IsString()
  @IsOptional()
  SOURCE: string;

  @IsOptional()
  ESTADO: any;

  @IsOptional()
  MercadoDestino: any[];

  @IsOptional()
  Imagen: any[];

  @IsOptional()
  NroRegSENASA: any;

  @IsOptional()
  DatosSIGCER: any;

  @IsOptional()
  Octogonos: any;

  @IsOptional()
  LinkRegistries: any;

  @IsNumber()
  price: number;
}

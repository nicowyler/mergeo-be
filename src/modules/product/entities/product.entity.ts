import { UUID } from 'crypto';
import { DateAudit } from 'src/common/entities/base.entity';
import { BuyOrderProduct } from 'src/modules/buy-order/entities/buy-order-product.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { PreOrderProduct } from 'src/modules/pre-order/entities/pre-order-product.entity';
import { ProductList } from 'src/modules/product/entities/product-list.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique('UQ_PRODUCT_NAME', ['name', 'price', 'brand', 'net_content', 'company'])
@Unique('UQ_PRODUCT_GTIN', ['gtin'])
export class Product extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({ nullable: false })
  gtin: string;

  @Column({ nullable: false })
  name: string;

  @Column({ default: 'kg' })
  measurementUnit: string;

  @Column('decimal') // Represents how many base units (grams) correspond to one unit of this product's measurement unit
  unitConversionFactor: number;

  @Column('decimal')
  price: number;

  @Column({ nullable: true })
  description: string;

  @Column()
  brand: string;

  @Column({ nullable: true })
  variety: string;

  @Column('decimal', { nullable: true })
  net_content: number;

  @Column({ nullable: true })
  segment: string;

  @Column({ nullable: true })
  family: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  units: number;

  @Column({ nullable: true })
  manufacturer_name: string;

  @Column({ nullable: true })
  manufacturer_id: string;

  @Column({ nullable: true })
  manufacturer_country: string;

  @ManyToOne(() => Company, (company) => company.products)
  company: Company;

  @OneToMany(
    () => PreOrderProduct,
    (preOrderProduct) => preOrderProduct.product,
  )
  preOrderProducts: PreOrderProduct[];

  @OneToMany(
    () => BuyOrderProduct,
    (buyOrderProduct) => buyOrderProduct.product,
  )
  buyOrderProduct: BuyOrderProduct[];

  @ManyToMany(() => ProductList, (productList) => productList.products)
  @JoinTable() // Defines the join table
  lists: ProductList[];
}

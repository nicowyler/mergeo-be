import { UUID } from 'crypto';
import { DateAudit } from 'src/common/entities/base.entity';
import { BuyOrderProduct } from 'src/modules/buy-order/entities/buy-order-product.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { PreOrderProduct } from 'src/modules/pre-order/entities/pre-order-product.entity';
import { BlackList } from 'src/modules/product/entities/black-list.entity';
import { DiscountsList } from 'src/modules/product/entities/dicount-list.entity';
import { ActivityLog } from 'src/modules/product/entities/prouct-activity-log.entity';
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
@Unique('UQ_PRODUCT_GTIN_COMPANY', ['gtin', 'company'])
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

  @Column('decimal')
  pricePerBaseUnit: number;

  @Column({ nullable: true })
  description: string;

  @Column()
  brand: string;

  @Column({ nullable: true })
  variety: string;

  @Column('decimal', { nullable: true })
  netContent: number;

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

  @ManyToMany(() => DiscountsList, (discountsList) => discountsList.products)
  @JoinTable() // Defines the join table
  lists: DiscountsList[];

  @OneToMany(() => ActivityLog, (activityLog) => activityLog.product)
  userActivity: ActivityLog[];

  @ManyToMany(() => BlackList, (blackList) => blackList.products)
  blackLists: BlackList[];

  @Column({ type: 'boolean', nullable: true, default: null })
  isPickUp: boolean;

  @Column({ type: 'boolean', nullable: true, default: true })
  isActive: boolean;

  isFavorite: boolean;
  providerId: UUID;
  morePresentations: boolean;
  inInventory: boolean;
}

export type ProductWithFavorite = Product & { isFavorite: boolean };

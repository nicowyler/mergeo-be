import { DateAudit } from 'src/common/entities/base.entity';
import { Company } from 'src/modules/company/company.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique('UQ_PRODUCT_NAME', ['name', 'price', 'brand', 'net_content', 'company'])
export class Product extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ nullable: true })
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
}

import { UUID } from 'crypto';
import { DateAudit } from 'src/common/entities/base.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique('UQ_PROSDUCT_LIST_NAME', ['name'])
export class DiscountsList extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  discount: number;

  @ManyToOne(() => Company, (company) => company.productLists, {
    nullable: false,
  })
  ownerCompany: Company; // The owner of the list

  @ManyToMany(() => Company)
  @JoinTable()
  companies: Company[]; // Companies receiving the discount

  @ManyToMany(() => Product, (product) => product.lists)
  products: Product[];
}

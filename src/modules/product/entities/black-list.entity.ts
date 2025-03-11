import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Product } from './product.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { UUID } from 'crypto';

@Entity()
export class BlackList {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @ManyToOne(() => Company, (company) => company.blackLists)
  company: Company;

  @ManyToMany(() => Product, (product) => product.blackLists)
  @JoinTable()
  products: Product[];
}

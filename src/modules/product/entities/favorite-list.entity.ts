import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Product } from './product.entity';
import { UUID } from 'crypto';
import { Company } from 'src/modules/company/entities/company.entity';

@Entity()
export class FavoriteList {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @ManyToOne(() => Company, (company) => company.favoriteLists)
  company: Company;

  @ManyToMany(() => Product)
  @JoinTable()
  products: Product[];
}

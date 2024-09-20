import { SearchListProduct } from 'src/modules/searchList/searchListProduct.entity';
import { DateAudit } from '../../common/entities/base.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity()
@Unique('UQ_LIST_NAME', ['name'])
export class SearchList extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('uuid')
  companyId: string;

  @Column()
  createdBy: string;

  @ManyToMany(() => SearchListProduct, (product) => product.searchLists, {
    cascade: true, // Optionally, cascade operations (e.g., saving) on related entities
  })
  @JoinTable() // This decorator is needed on one side of the Many-to-Many relation to define the join table
  products: SearchListProduct[];
}

import { SearchList } from 'src/modules/searchList/searchList.entity';
import { DateAudit } from '../../common/entities/base.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  ManyToMany,
} from 'typeorm';

@Entity()
@Unique('UQ_PRODUCT_LIST_NAME', ['name'])
export class SearchListProduct extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string | null;

  @ManyToMany(() => SearchList, (searchList) => searchList.products)
  searchLists: SearchList[];
}

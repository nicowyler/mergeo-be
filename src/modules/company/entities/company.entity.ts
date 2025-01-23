import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Unique,
  OneToOne,
} from 'typeorm';
import { PickUpPoint } from 'src/modules/company/pickUpPoints/pickUpPoint.entity';
import { DropZone } from 'src/modules/company/dropZones/dropZone.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { PreOrder } from 'src/modules/pre-order/entities/pre-order.entity';
import { UUID } from 'crypto';
import { DateAudit } from 'src/common/entities/base.entity';
import { User } from 'src/modules/user/user.entity';
import { Branch } from 'src/modules/company/entities/branch.entity';
import { BlackList } from 'src/modules/product/entities/black-list.entity';
import { FavoriteList } from 'src/modules/product/entities/favorite-list.entity';
import { ClientBlackList } from 'src/modules/company/entities/client-black-list.entity';
import { DiscountsList } from 'src/modules/product/entities/dicount-list.entity';

@Entity()
@Unique('UQ_BUSINESS_NAME', ['razonSocial'])
@Unique('UQ_CUIT', ['cuit'])
export class Company extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column()
  name: string;

  @Column()
  razonSocial: string;

  @Column({ type: 'bigint' })
  cuit: number;

  @Column()
  activity: string;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Branch, (branch) => branch.company, { cascade: true })
  branches: Branch[];

  @OneToMany(() => PickUpPoint, (pickUpPoint) => pickUpPoint.company, {
    cascade: true,
  })
  pickUpPoints: PickUpPoint[];

  @OneToMany(() => DropZone, (dropZone) => dropZone.company, {
    cascade: true,
  })
  dropZones: DropZone[];

  @OneToMany(() => Product, (product) => product.company)
  products: Product[];

  @OneToMany(() => PreOrder, (preOrder) => preOrder.client)
  clientPreOrders: PreOrder[]; // Pre-orders placed by this company

  @OneToMany(() => PreOrder, (preOrder) => preOrder.provider)
  providerPreOrders: PreOrder[]; // Pre-orders fulfilled by this company

  @OneToMany(() => DiscountsList, (dicountList) => dicountList.companies)
  productLists: DiscountsList[];

  // Add blacklist relation
  @OneToMany(() => BlackList, (blackList) => blackList.company, {
    cascade: true,
  })
  blackLists: BlackList[];

  // Add favoriteList relation
  @OneToMany(() => FavoriteList, (favoriteList) => favoriteList.company, {
    cascade: true,
  })
  favoriteLists: FavoriteList[];

  @OneToOne(() => ClientBlackList, (blacklist) => blacklist.owner)
  blackList: ClientBlackList;
}

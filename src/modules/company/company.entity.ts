import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { DateAudit } from '../../common/entities/base.entity';
import { Branch } from '../../modules/company/branch.entity';
import { User } from '../../modules/user/user.entity';
import { PickUpPoint } from 'src/modules/company/pickUpPoints/pickUpPoint.entity';
import { DropZone } from 'src/modules/company/dropZones/dropZone.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { PreOrder } from 'src/modules/pre-order/entities/pre-order.entity';
import { UUID } from 'crypto';
import { ProductList } from 'src/modules/product/entities/productList.entity';

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

  @OneToMany(() => ProductList, (productList) => productList.company)
  productLists: ProductList[];
}

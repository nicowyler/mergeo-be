import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from 'src/modules/company/company.entity';
import { UUID } from 'crypto';
import { DateAudit } from 'src/common/entities/base.entity';
import { BuyOrderProduct } from 'src/modules/buy-order/entities/buy-order-product.entity';
import { PreOrder } from 'src/modules/pre-order/entities/pre-order.entity';

@Entity()
export class BuyOrder extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({ type: 'uuid' })
  userId: UUID;

  @Column({ type: 'int', generated: 'increment' })
  orderNumber: number;

  // we need the client to show to the Provider
  @ManyToOne(() => Company, (company) => company.clientPreOrders)
  client: Company;

  // we need the provider to show to the buyer
  @ManyToOne(() => Company, (company) => company.providerPreOrders)
  provider: Company;

  @OneToMany(
    () => BuyOrderProduct,
    (buyOrderProduct) => buyOrderProduct.buyOrder,
    {
      cascade: true,
    },
  )
  buyOrderProducts: BuyOrderProduct[];

  @OneToOne(() => PreOrder)
  @JoinColumn()
  preOrder: PreOrder;
}

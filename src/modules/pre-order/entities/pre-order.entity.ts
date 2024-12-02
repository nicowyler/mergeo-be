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
import { PreOrderProduct } from 'src/modules/pre-order/entities/pre-order-product.entity';
import { PreOrderCriteria } from 'src/modules/pre-order/entities/pre-order-criterias.entity';
import { DateAudit } from 'src/common/entities/base.entity';
import { PRE_ORDER_STATUS } from 'src/common/enum/preOrder.enum';
import { BuyOrder } from 'src/modules/buy-order/entities/buy-order.entity';

@Entity()
export class PreOrder extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({ type: 'int', generated: 'increment' })
  preOrderNumber: number;

  @Column()
  buyerId: UUID; // this is a userId

  @Column({
    type: 'enum',
    enum: PRE_ORDER_STATUS,
    default: PRE_ORDER_STATUS.pending,
  })
  status: PRE_ORDER_STATUS;

  @Column({ default: 1 })
  instance: number;

  @Column({ type: 'timestamp' })
  responseDeadline: Date;

  @ManyToOne(() => Company, (company) => company.clientPreOrders)
  client: Company; // Company placing the pre-order

  @ManyToOne(() => Company, (company) => company.providerPreOrders)
  provider: Company; // Company fulfilling the pre-order

  @OneToMany(
    () => PreOrderProduct,
    (preOrderProduct) => preOrderProduct.preOrder,
    {
      cascade: true,
    },
  )
  preOrderProducts: PreOrderProduct[]; // Link to PreOrderProduct entities

  @OneToOne(() => PreOrderCriteria, { cascade: true, eager: true })
  @JoinColumn() // Specifies that PreOrder holds the foreign key
  criteria: PreOrderCriteria;

  @OneToOne(() => BuyOrder, (buyOrder) => buyOrder.preOrder)
  buyOrder: BuyOrder;
}

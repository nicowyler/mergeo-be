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

@Entity()
export class PreOrder {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column()
  buyerId: UUID; // this is a userId

  @Column({ default: 'pending' })
  status: string; // pending, accepted, declined, failed

  @Column({ default: 'first-selection' })
  instance: string; // first-selection, second-selection...

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
}

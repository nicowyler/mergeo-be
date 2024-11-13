import { UUID } from 'crypto';
import { BuyOrder } from 'src/modules/buy-order/entities/buy-order.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BuyOrderProduct {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @ManyToOne(() => BuyOrder, (buyOrder) => buyOrder.buyOrderProducts)
  buyOrder: BuyOrder;

  @ManyToOne(() => Product, (product) => product.buyOrderProduct)
  product: Product;

  @Column({ nullable: false })
  quantity: number; // Quantity of each product in the pre-order
}

import { UUID } from 'crypto';
import { PreOrder } from 'src/modules/pre-order/entities/pre-order.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PreOrderProduct {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @ManyToOne(() => PreOrder, (preOrder) => preOrder.preOrderProducts)
  preOrder: PreOrder;

  @ManyToOne(() => Product, (product) => product.preOrderProducts)
  product: Product;

  @Column({ nullable: false })
  quantity: number; // Quantity of each product in the pre-order
}

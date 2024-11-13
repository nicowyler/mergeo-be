import { Entity, Column, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { UUID } from 'crypto';
import { PreOrder } from 'src/modules/pre-order/entities/pre-order.entity';
import { ReplacementCriteria } from 'src/common/enum/replacementCriteria.enum';

@Entity()
export class PreOrderCriteria {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({ type: 'uuid' })
  branchId: UUID;

  @Column({ type: 'enum', enum: ReplacementCriteria })
  replacementCriteria: ReplacementCriteria;

  @Column({ type: 'timestamp', nullable: true })
  expectedDeliveryStartDay?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedDeliveryEndDay?: Date;

  @Column({ type: 'int', nullable: true })
  startHour?: number;

  @Column({ type: 'int', nullable: true })
  endHour?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'grams' })
  baseMeasurementUnit?: string = 'grams';

  @Column({ type: 'boolean', nullable: true, default: false })
  isPickUp?: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  pickUpLng?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  pickUpLat?: number;

  @Column({ type: 'int', nullable: true })
  pickUpRadius?: number;

  @OneToOne(() => PreOrder, (preOrder) => preOrder.criteria)
  preOrder: PreOrder;
  reponseDeadline: any;
}

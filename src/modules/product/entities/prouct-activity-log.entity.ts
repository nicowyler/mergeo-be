import { UUID } from 'crypto';
import { ActivityEnum } from 'src/common/enum/activityLog.enum';
import { Product } from 'src/modules/product/entities/product.entity';
import { User } from 'src/modules/user/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({
    type: 'enum',
    enum: ActivityEnum,
  })
  action: ActivityEnum;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ nullable: true })
  fileName: string;

  @ManyToOne(() => Product, (product) => product.userActivity, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ManyToOne(() => User, { nullable: true })
  user: User; // User who performed the action

  @Column({ nullable: true })
  details: string; // Additional metadata about the activity
}

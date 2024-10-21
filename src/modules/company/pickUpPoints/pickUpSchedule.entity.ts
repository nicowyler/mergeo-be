import { PickUpPoint } from 'src/modules/company/pickUpPoints/pickUpPoint.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PickUpSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  day: string;

  @Column()
  startHour: number;

  @Column()
  endHour: number;

  @ManyToOne(() => PickUpPoint, (pickUpPoint) => pickUpPoint.schedules, {
    onDelete: 'CASCADE',
  })
  pickUpPoint: PickUpPoint;
}

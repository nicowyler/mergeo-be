import { DropZone } from 'src/modules/company/dropZones/dropZone.entity';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class DropZoneSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  day: string;

  @Index('idx_start_hour')
  @Column()
  startHour: number;

  @Index('idx_end_hour')
  @Column()
  endHour: number;

  @ManyToOne(() => DropZone, (dropZone) => dropZone.schedules, {
    onDelete: 'CASCADE',
  })
  dropZone: DropZone;
}

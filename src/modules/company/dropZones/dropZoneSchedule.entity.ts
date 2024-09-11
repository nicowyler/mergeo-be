import { DropZone } from 'src/modules/company/dropZones/dropZone.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DropZoneSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  day: string;

  @Column()
  startHour: string;

  @Column()
  endHour: string;

  @ManyToOne(() => DropZone, (dropZone) => dropZone.schedules, {
    onDelete: 'CASCADE',
  })
  dropZone: DropZone;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  JoinColumn,
  OneToMany,
  Polygon,
} from 'typeorm';
import { Company } from '../company.entity';
import { DropZoneSchedule } from 'src/modules/company/dropZones/dropZoneSchedule.entity';

@Entity()
@Unique('UQ_DZ_NAME', ['name'])
export class DropZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('geometry', { spatialFeatureType: 'Polygon', srid: 4326 })
  zone: Polygon;

  @ManyToOne(() => Company, (company) => company.dropZones)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => DropZoneSchedule, (schedule) => schedule.dropZone, {
    cascade: true,
  })
  schedules: DropZoneSchedule[];
}

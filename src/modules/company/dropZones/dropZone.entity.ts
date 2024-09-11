import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Company } from '../company.entity';
import { Address, ZoneAddress } from 'src/modules/company/address.entity';
import { DropZoneSchedule } from 'src/modules/company/dropZones/dropZoneSchedule.entity';

@Entity()
@Unique('UQ_DZ_NAME', ['name'])
export class DropZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToOne(() => Address, { nullable: true }) // Ensure this is a ManyToOne or OneToOne as needed
  @JoinColumn({ name: 'addressId' })
  address: ZoneAddress;

  @ManyToOne(() => Company, (company) => company.dropZones)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => DropZoneSchedule, (schedule) => schedule.dropZone, {
    cascade: true,
  })
  schedules: DropZoneSchedule[];
}

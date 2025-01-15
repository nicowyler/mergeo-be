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
import { PickUpSchedule } from 'src/modules/company/pickUpPoints/pickUpSchedule.entity';
import { Address } from 'src/modules/company/entities/address.entity';
import { Company } from 'src/modules/company/entities/company.entity';

@Entity()
@Unique('UQ_PP_NAME', ['name'])
export class PickUpPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @OneToOne(() => Address, { nullable: true }) // Ensure this is a ManyToOne or OneToOne as needed
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @ManyToOne(() => Company, (company) => company.pickUpPoints)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @OneToMany(() => PickUpSchedule, (schedule) => schedule.pickUpPoint, {
    cascade: true,
  })
  schedules: PickUpSchedule[];
}

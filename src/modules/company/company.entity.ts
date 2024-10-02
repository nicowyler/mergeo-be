import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Unique,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { DateAudit } from '../../common/entities/base.entity';
import { Branch } from '../../modules/company/branch.entity';
import { User } from '../../modules/user/user.entity';
import { Address } from '../../modules/company/address.entity';
import { PickUpPoint } from 'src/modules/company/pickUpPoints/pickUpPoint.entity';
import { DropZone } from 'src/modules/company/dropZones/dropZone.entity';

@Entity()
@Unique('UQ_BUSINESS_NAME', ['razonSocial'])
@Unique('UQ_CUIT', ['cuit'])
export class Company extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  razonSocial: string;

  @Column({ type: 'bigint' })
  cuit: number;

  @OneToOne(() => Address, (address) => address.company, { cascade: true })
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @Column()
  activity: string;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Branch, (branch) => branch.company, { cascade: true })
  branches: Branch[];

  @OneToMany(() => PickUpPoint, (pickUpPoint) => pickUpPoint.company, {
    cascade: true,
  })
  pickUpPoints: PickUpPoint[];

  @OneToMany(() => DropZone, (dropZone) => dropZone.company, {
    cascade: true,
  })
  dropZones: DropZone[];
}

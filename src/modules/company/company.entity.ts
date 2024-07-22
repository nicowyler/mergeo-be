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
import { Address } from 'src/modules/company/address.entity';

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

  @Column()
  cuit: number;

  @OneToOne(() => Address, (address) => address.company, { cascade: true })
  @JoinColumn()
  address: Address;

  @Column()
  activity: string;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Branch, (branch) => branch.company)
  branches: Branch[];
}
export { Address };

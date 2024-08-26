import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Address, Company } from './company.entity';

@Entity()
@Unique('UQ_NAME', ['name'])
export class Branch {
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

  @ManyToOne(() => Company, (company) => company.branches)
  @JoinColumn({ name: 'companyId' }) // Optional: Customize the join column name
  company: Company;
}

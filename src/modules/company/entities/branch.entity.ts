import { Address } from 'src/modules/company/entities/address.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
@Unique('UQ_NAME', ['name', 'company'])
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ default: false, nullable: true })
  isMain?: boolean;

  @Column({ nullable: true })
  phoneNumber?: string;

  @OneToOne(() => Address, { nullable: true, cascade: true }) // Ensure this is a ManyToOne or OneToOne as needed
  @JoinColumn({ name: 'addressId' })
  address: Address;

  @ManyToOne(() => Company, (company) => company.branches)
  @JoinColumn({ name: 'companyId' }) // Optional: Customize the join column name
  company: Company;
}

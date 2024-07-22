import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Company } from './company.entity';

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

  @Column()
  address: string;

  @ManyToOne(() => Company, (company) => company.branches)
  company: Company;
}

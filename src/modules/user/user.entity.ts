import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DateAudit } from '../../common/entities/base.entity';
import { Company } from '../company/company.entity';
import { ACCOUNT_TYPE } from '../../common/enum';
import { Role } from '../role/role.entity';

@Entity()
export class User extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ default: null })
  firstName: string;

  @Column({ default: null })
  lastName: string;

  @Column({ default: null })
  phoneNumber: string;

  @Column({ nullable: false })
  password: string;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ default: null })
  activationCode: string;

  @Column({
    type: 'enum',
    enum: ACCOUNT_TYPE,
    nullable: false,
    default: [ACCOUNT_TYPE.CLIENT],
  })
  accountType: string;

  @ManyToOne(() => Company, (company) => company.users)
  company: Company;

  @OneToMany(() => Role, (role) => role.user)
  role: Role[];
}

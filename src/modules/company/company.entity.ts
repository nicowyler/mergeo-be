import { DateAudit } from '@/common/entities/base.entity';
import { Branch } from '../../modules/company/branch.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from '@/modules/user/user.entity';

@Entity()
export class Company extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  razonSocial: string;

  @Column()
  cuit: number;

  @Column()
  country: string;

  @Column()
  province: string;

  @Column()
  locality: string;

  @Column()
  phoneNumber: string;

  @Column()
  activity: string;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Branch, (branch) => branch.company)
  branches: Branch[];
}

import { User } from '../../modules/user/user.entity';
import { Permission } from './permission.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  Unique,
} from 'typeorm';

@Entity()
@Unique('UQ_ROLE_NAME', ['name'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions: Permission[];

  @Column('uuid')
  companyId: string;

  @ManyToOne(() => User, (user) => user.role)
  @JoinTable()
  user: User;
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateAudit } from '../../common/entities/base.entity';
import { Role } from '@/common/enum';

@Entity()
export class User extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  firstName: string;

  @Column({ nullable: false })
  lastName: string;

  @Column({ nullable: false })
  phoneNumber: string;

  @Column({ nullable: false })
  password: string;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ default: null })
  activationCode: string;

  @Column({
    type: 'enum',
    enum: Role,
    nullable: false,
    array: true,
    default: [Role.USER],
  })
  roles: Role[];
}

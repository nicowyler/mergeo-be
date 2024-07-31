import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('UQ_NAME', ['name'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  group: string;

  @Column()
  action: string;

  @Column('boolean', { default: false })
  hasPermission: boolean;
}

import { UUID } from 'crypto';
import { Company } from 'src/modules/company/entities/company.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinTable,
  ManyToMany,
  JoinColumn,
} from 'typeorm';

@Entity()
export class ClientBlackList {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  // The company that owns this blacklist
  @OneToOne(() => Company, (company) => company.blackList, { cascade: true })
  @JoinColumn()
  owner: Company;

  @ManyToMany(() => Company)
  @JoinTable()
  companies: Company[];
}

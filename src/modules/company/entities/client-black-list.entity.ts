import { UUID } from 'crypto';
import { Company } from 'src/modules/company/entities/company.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class ClientBlackList {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @ManyToOne(() => Company, (company) => company.clientBlackLists)
  company: Company;
}

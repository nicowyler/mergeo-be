import { Company } from '../../modules/company/company.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  Point,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326 })
  polygon: Point;

  @OneToOne(() => Company, (company) => company.address)
  @JoinColumn()
  company: Company;
}

import { Branch } from 'src/modules/company/branch.entity';
import { Company } from '../../modules/company/company.entity';
import {
  Column,
  Entity,
  Index,
  OneToOne,
  Point,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index('idx_point_location', ['location'], { spatial: true })
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  locationId: string;

  @Column()
  name: string;

  @Column('geometry', { spatialFeatureType: 'Point', srid: 4326 })
  location: Point;

  @OneToOne(() => Branch, (branch) => branch.address)
  branch: Branch;
}

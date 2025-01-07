import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('units')
export class Unit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { array: true })
  aliases: string[]; // Nombres alternativos (e.g., ["GR", "Gr", "gramos"])

  @Column()
  standardName: string; // Nombre estándar (e.g., "gr")
}

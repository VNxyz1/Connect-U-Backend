import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { EventDB } from './EventDB';

@Entity()
export class CategoryDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  germanName: string;

  @ManyToMany(() => EventDB, (event) => event.categories)
  events: EventDB[];
}

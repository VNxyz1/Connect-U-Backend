import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { EventDB } from './EventDB';

@Entity()
export class GenderDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  gender: number;

  @ManyToMany(() => EventDB, (event) => event.preferredGenders)
  events: EventDB[];
}

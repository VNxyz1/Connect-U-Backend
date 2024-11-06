import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { GenderEnum } from './enums/GenderEnum';
import { EventDB } from './EventDB';


@Entity()
export class GenderDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  gender: GenderEnum;

  @ManyToMany(() => EventDB, event => event.preferredGenders)
  events: EventDB[];
}
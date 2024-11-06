import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { EventDB } from './EventDB';
import { ListEntryDB } from './ListEntryDB';

@Entity()
export class ListDB {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => EventDB)
  event: EventDB;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => ListEntryDB, (listEntry) => listEntry.list)
  listEntries: ListEntryDB[];
}

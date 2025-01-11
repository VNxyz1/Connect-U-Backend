import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { EventDB } from './EventDB';
import { ListEntryDB } from './ListEntryDB';
import { UserDB } from './UserDB';

@Entity()
export class ListDB {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: string;

  @ManyToOne(() => EventDB)
  event: EventDB;

  @ManyToOne(() => UserDB)
  creator: UserDB;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => ListEntryDB, (listEntry) => listEntry.list, {
    onDelete: 'CASCADE',
  })
  listEntries: ListEntryDB[];
}

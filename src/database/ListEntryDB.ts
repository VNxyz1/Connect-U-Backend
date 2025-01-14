import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ListDB } from './ListDB';
import { UserDB } from './UserDB';

@Entity()
export class ListEntryDB {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: string;

  @ManyToOne(() => ListDB, (list) => list.listEntries, { onDelete: 'CASCADE' })
  list: ListDB;

  @ManyToOne(() => UserDB)
  user: UserDB;

  @Column()
  content: string;
}

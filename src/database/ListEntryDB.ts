import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ListDB } from './ListDB';
import { UserDB } from './UserDB';

@Entity()
export class ListEntryDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: new Date().toISOString() })
  timestamp: string;

  @ManyToOne(() => ListDB, (list) => list.listEntries, { onDelete: 'CASCADE' })
  list: ListDB;

  @ManyToOne(() => UserDB)
  user: UserDB;

  @Column()
  content: string;
}

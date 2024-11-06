import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ListDB } from './ListDB';
import { UserDB } from './UserDB';

@Entity()
export class ListEntryDB {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ListDB)
  list: ListDB;

  @ManyToOne(() => UserDB)
  user: UserDB;

  @Column()
  content: string;

  @Column({default: false})
  isChecked: boolean;
}

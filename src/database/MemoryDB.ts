import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { UserDB } from './UserDB';
import { EventDB } from './EventDB';

@Entity()
export class MemoryDB {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserDB)
  user: UserDB;

  @ManyToOne(() => EventDB)
  event: EventDB;

  @Column()
  isPositive: boolean;

  @Column()
  picture: string;

  @Column()
  song: string;
}

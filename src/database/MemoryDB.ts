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

  @Column({ nullable: true })
  isPositive: boolean;

  @Column({ nullable: true })
  picture: string;

  @Column({ nullable: true })
  song: string;
}

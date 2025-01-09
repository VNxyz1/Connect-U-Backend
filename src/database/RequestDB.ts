import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { UserDB } from './UserDB';
import { EventDB } from './EventDB';

@Entity()
export class RequestDB {
  @PrimaryGeneratedColumn()
  id: number;

  @UpdateDateColumn()
  timestamp: string;

  @ManyToOne(() => UserDB)
  user: UserDB;

  @ManyToOne(() => EventDB)
  event: EventDB;

  @Column()
  type: number;

  @Column({ default: false })
  denied: boolean;
}

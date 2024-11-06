import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { UserDB } from './UserDB';
import { EventDB } from './EventDB';
import { RequestEnum } from './enums/RequestEnum';

@Entity()
export class RequestDB {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserDB)
  user: UserDB;

  @ManyToOne(() => EventDB)
  event: EventDB;

  @Column()
  type: RequestEnum;
}
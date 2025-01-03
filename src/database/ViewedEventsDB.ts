import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EventDB } from './EventDB';
import { UserDB } from './UserDB';
import ViewEventEnum from './enums/ViewEventEnum';

@Entity()
export default class ViewedEventsDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  viewed: ViewEventEnum;

  @ManyToOne(() => EventDB, (event) => event.viewEvents)
  event: EventDB;

  @ManyToOne(() => UserDB, (user) => user.viewEvents)
  user: UserDB;
}

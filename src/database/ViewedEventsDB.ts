import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EventDB } from './EventDB';
import { UserDB } from './UserDB';

@Entity()
export default class ViewedEventsDB {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * enum type is {@link ViewEventEnum}
   */
  @Column()
  viewed: string;

  @ManyToOne(() => EventDB, (event) => event.viewEvents)
  event: EventDB;

  @ManyToOne(() => UserDB, (user) => user.viewEvents)
  user: UserDB;
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { EventDB } from './EventDB';
import { UserDB } from './UserDB';

@Entity()
export class TagDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  title: string;

  @ManyToMany(() => EventDB, (event) => event.tags)
  events: EventDB[];

  @ManyToMany(() => UserDB, (user) => user.tags)
  users: UserDB[];
}

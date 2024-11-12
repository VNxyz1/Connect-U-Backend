import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UserDB } from './UserDB';
import { StatusEnum } from './enums/StatusEnum';
import { EventtypeEnum } from './enums/EventtypeEnum';
import { MemoryDB } from './MemoryDB';
import { GenderDB } from './GenderDB';
import { RequestDB } from './RequestDB';
import { ListDB } from './ListDB';
import { TagDB } from './TagDB';
import { CategoryDB } from './CategoryDB';
import { MessageDB } from './MessageDB';

@Entity()
export class EventDB {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserDB)
  host: UserDB;

  @Column({ default: 0 })
  status: StatusEnum;

  @Column({ type: 'datetime' })
  dateAndTime: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  type: EventtypeEnum;

  @Column({ default: 'empty.png' })
  picture: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ default: true })
  showAddress: boolean;

  @Column({ nullable: true })
  streetNumber: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  city: string;

  @Column()
  participantsNumber: number;

  @Column({ nullable: true })
  startAge: number;

  @Column({ nullable: true })
  endAge: number;

  @ManyToMany(() => UserDB, (user) => user.participatedEvents)
  participants: UserDB[];

  @OneToMany(() => RequestDB, (request) => request.event)
  requests: RequestDB[];

  @OneToMany(() => MessageDB, (message) => message.event)
  messages: MessageDB[];

  @OneToMany(() => ListDB, (list) => list.event)
  lists: ListDB[];

  @ManyToMany(() => UserDB, (user) => user.favoritedEvents)
  favorited: UserDB[];

  @OneToMany(() => MemoryDB, (memory) => memory.event)
  memories: MemoryDB[];

  @ManyToMany(() => GenderDB, (gender) => gender.events)
  @JoinTable({ name: 'EventPreferredGenders' })
  preferredGenders: GenderDB[];

  @ManyToMany(() => TagDB, (tag) => tag.events)
  @JoinTable({ name: 'EventTags' })
  tags: TagDB[];

  @ManyToMany(() => CategoryDB, (category) => category.events)
  @JoinTable({ name: 'EventCategories' })
  categories: CategoryDB[];
}

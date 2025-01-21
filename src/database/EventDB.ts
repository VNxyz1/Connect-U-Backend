import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
} from 'typeorm';
import { UserDB } from './UserDB';
import { MemoryDB } from './MemoryDB';
import { GenderDB } from './GenderDB';
import { RequestDB } from './RequestDB';
import { ListDB } from './ListDB';
import { TagDB } from './TagDB';
import { CategoryDB } from './CategoryDB';
import { MessageDB } from './MessageDB';
import { SurveyDB } from './SurveyDB';
import ViewedEventsDB from './ViewedEventsDB';
import { StatusEnum } from './enums/StatusEnum';

@Entity()
export class EventDB {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  timestamp: string;

  @ManyToOne(() => UserDB)
  host: UserDB;

  @Column({ default: StatusEnum.upcoming })
  status: number;

  @Column()
  dateAndTime: string;

  @Column()
  title: string;

  @Column({ default: '' })
  description: string;

  /**
   * type: {@link EventtypeEnum}
   */
  @Column({ default: 0 })
  type: number;

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

  @OneToMany(() => SurveyDB, (survey) => survey.event)
  surveys: SurveyDB[];

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

  @OneToMany(() => ViewedEventsDB, (viewEvents) => viewEvents.event)
  viewEvents: ViewedEventsDB[];
}

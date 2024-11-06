import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinTable, ManyToMany } from 'typeorm';
import { IsEmail, IsPhoneNumber } from 'class-validator';
import { GenderEnum } from './enums/GenderEnum';
import { EventDB } from './EventDB';
import { MemoryDB } from './MemoryDB';
import { RequestDB } from './RequestDB';
import { AchievementDB } from './AchievementDB';
import { ListEntryDB } from './ListEntryDB';
import { SurveyEntryDB } from './SurveyEntryDB';
import { MessageDB } from './MessageDB';
import { ReactionDB } from './ReactionDB';
import { TagDB } from './TagDB';


@Entity()
export class UserDB {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  @IsEmail()
  email: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  birthday: Date;

  @Column({ nullable: true })
  @IsPhoneNumber()
  phoneNumber: string;

  @Column({ default: 'empty.png' })
  profilePicture: string;

  @Column({ nullable: true })
  pronouns: string;

  @Column({ nullable: true })
  profileText: string;

  @Column({ nullable: true })
  streetNumber: string;

  @Column({ nullable: true })
  street: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: 0 })
  gender: GenderEnum;

  @OneToMany(() => EventDB, (event) => event.host)
  hostedEvents: EventDB[];

  @OneToMany(() => RequestDB, (request) => request.user)
  requests: RequestDB[];

  @ManyToMany(() => EventDB, event => event.participants)
  @JoinTable({ name: 'ParticipateDB' })
  participatedEvents: EventDB[];

  @ManyToMany(() => EventDB, event => event.favorited)
  @JoinTable({ name: 'FavoriteDB' })
  favoritedEvents: EventDB[];

  @OneToMany(() => MemoryDB, (memory) => memory.user)
  memories: MemoryDB[];

  @ManyToMany(() => UserDB, user => user.friendOf)
  @JoinTable({ name: 'FriendshipDB' })
  friends: Promise<UserDB[]>;

  @ManyToMany(() => UserDB, user => user.friends)
  friendOf: Promise<UserDB[]>;

  @OneToMany(() => ListEntryDB, (listEntry) => listEntry.user)
  listEntries: ListEntryDB[];

  @ManyToMany(() => AchievementDB, achievement => achievement.users)
  achievements: Promise<AchievementDB[]>;

  @ManyToMany(() => SurveyEntryDB, surveyEntry => surveyEntry.users)
  surveyEntries: Promise<SurveyEntryDB[]>;

  @OneToMany(() => MessageDB, message => message.writer)
  messages: MessageDB[];

  @OneToMany(() => ReactionDB, reaction => reaction.user)
  reactions: ReactionDB[];

  @ManyToMany(() => TagDB, tag => tag.users)
  @JoinTable({ name: 'UserTags' })
  tags: TagDB[];
}

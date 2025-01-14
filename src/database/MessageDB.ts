import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
} from 'typeorm';
import { EventDB } from './EventDB';
import { UserDB } from './UserDB';
import { ReactionDB } from './ReactionDB';

@Entity()
export class MessageDB {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => EventDB)
  event: EventDB;

  @ManyToOne(() => UserDB, { nullable: true }) // writer is nullable for system messages
  writer: UserDB | null;

  @Column()
  text: string;

  @CreateDateColumn()
  timestamp: string;

  @OneToMany(() => ReactionDB, (reaction) => reaction.message)
  reactions: ReactionDB[];

  @ManyToMany(() => UserDB, (user) => user.unreadMessages)
  @JoinTable({
    name: 'UnreadMessages',
    joinColumn: { name: 'messageId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  unreadUsers: UserDB[];
}

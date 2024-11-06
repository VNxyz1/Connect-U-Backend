import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { MessageDB } from './MessageDB';
import { UserDB } from './UserDB';

@Entity()
export class ReactionDB {
  @Unique(['message', 'user', 'type'])
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => MessageDB, message => message.reactions)
  message: MessageDB;

  @ManyToOne(() => UserDB, user => user.reactions)
  user: UserDB;

  @Column()
  type: string;
}

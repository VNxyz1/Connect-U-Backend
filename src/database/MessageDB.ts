import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
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

  @Column()
  date: Date;

  @OneToMany(() => ReactionDB, reaction => reaction.message)
  reactions: ReactionDB[];
}

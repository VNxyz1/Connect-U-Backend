import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { UserDB } from './UserDB';

@Entity()
export class AchievementDB {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  icon: string;

  @Column()
  title: string;

  @Column()
  text: string;

  @ManyToMany(() => UserDB, user => user.achievements)
  users: Promise<UserDB[]>;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
} from 'typeorm';
import { UserDB } from './UserDB';
import { SurveyDB } from './SurveyDB';

@Entity()
export class SurveyEntryDB {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: string;

  @ManyToOne(() => SurveyDB, (survey) => survey.surveyEntries, {
    onDelete: 'CASCADE',
  })
  survey: SurveyDB;

  @Column()
  content: string;

  @ManyToMany(() => UserDB, (user) => user.surveyEntries, { cascade: true })
  @JoinTable({ name: 'UserSurveyEntries' })
  users: UserDB[];
}

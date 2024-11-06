import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany } from 'typeorm';
import { UserDB } from './UserDB';
import { SurveyDB } from './SurveyDB';

@Entity()
export class SurveyEntryDB {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SurveyDB, (survey) => survey.surveyEntries, { onDelete: 'CASCADE' })
  survey: SurveyDB;

  @Column()
  content: string;

  @ManyToMany(() => UserDB, user => user.surveyEntries)
  users: Promise<UserDB[]>;
}

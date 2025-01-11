import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { EventDB } from './EventDB';
import { SurveyEntryDB } from './SurveyEntryDB';
import { UserDB } from './UserDB';

@Entity()
export class SurveyDB {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  timestamp: string;

  @ManyToOne(() => EventDB)
  event: EventDB;

  @ManyToOne(() => UserDB)
  creator: UserDB;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => SurveyEntryDB, (surveyEntry) => surveyEntry.survey, {
    onDelete: 'CASCADE',
  })
  surveyEntries: SurveyEntryDB[];
}

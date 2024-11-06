import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { EventDB } from './EventDB';
import { SurveyEntryDB } from './SurveyEntryDB';

@Entity()
export class SurveyDB {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => EventDB)
  event: EventDB;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => SurveyEntryDB, (surveyEntry) => surveyEntry.survey)
  surveyEntries: SurveyEntryDB[];
}

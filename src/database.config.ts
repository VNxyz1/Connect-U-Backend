import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { UserDB } from './database/UserDB';
import { EventDB } from './database/EventDB';
import { TagDB } from './database/TagDB';
import { CategoryDB } from './database/CategoryDB';
import { MessageDB } from './database/MessageDB';
import { ReactionDB } from './database/ReactionDB';
import { ListEntryDB } from './database/ListEntryDB';
import { ListDB } from './database/ListDB';
import { GenderDB } from './database/GenderDB';
import { AchievementDB } from './database/AchievementDB';
import { MemoryDB } from './database/MemoryDB';
import { RequestDB } from './database/RequestDB';
import { SurveyDB } from './database/SurveyDB';
import { SurveyEntryDB } from './database/SurveyEntryDB';
import ViewedEventsDB from './database/ViewedEventsDB';

export const typeOrmEntities: EntityClassOrSchema[] = [
  UserDB,
  EventDB,
  TagDB,
  CategoryDB,
  MessageDB,
  ReactionDB,
  AchievementDB,
  GenderDB,
  ListDB,
  ListEntryDB,
  MemoryDB,
  RequestDB,
  SurveyDB,
  SurveyEntryDB,
  ViewedEventsDB,
];

export const databaseConfig = () =>
  TypeOrmModule.forRoot({
    // @ts-ignore
    type: process.env.DATABASE_TYPE || undefined,
    host: process.env.DATABASE_HOST || undefined,
    port: Number(process.env.DATABASE_PORT) || undefined,
    username: process.env.DATABASE_USERNAME || undefined,
    password: process.env.DATABASE_PASSWORD || undefined,
    database: process.env.DATABASE_DATABASENAME || undefined,
    entities: typeOrmEntities,
    synchronize: Boolean(process.env.DATABASE_SYNCHRONIZE) || false,
  });

export const databaseConfigForFeature = () =>
  TypeOrmModule.forFeature(typeOrmEntities);

import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmEntities } from '../src/database.config';
import * as fs from 'fs';

export const mockDbSetup = (componentName: string) => [
  TypeOrmModule.forRoot({
    type: 'sqlite',
    database: './_sqliteDb/temp.db.' + componentName,
    entities: typeOrmEntities,
    synchronize: true,
  }),
  TypeOrmModule.forFeature(typeOrmEntities),
];

export const mockDbRemove = (componentName: string) => {
  fs.unlink('./_sqliteDb/temp.db.' + componentName, (err) => {
    if (err) {
      throw err;
    }
  });
};

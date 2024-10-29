import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig, databaseConfigForFeature } from './database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local','.env.development', '.env'],
    }),
    databaseConfig(),
    databaseConfigForFeature(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

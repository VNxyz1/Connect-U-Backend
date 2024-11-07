import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig, databaseConfigForFeature } from './database.config';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env.development', '.env'],
    }),
    databaseConfig(),
    databaseConfigForFeature(),
  ],
  controllers: [AppController, UserController, AuthController],
  providers: [AppService, UserService, AuthService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig, databaseConfigForFeature } from './database.config';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JWTConstants } from './auth/constants';
import { UtilsService } from './utils/utils.service';
import { EventController } from './event/event.controller';
import { GenderController } from './gender/gender.controller';
import { CategoryController } from './category/category.controller';
import { EventService } from './event/event.service';
import { GenderService } from './gender/gender.service';
import { CategoryService } from './category/category.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local', '.env.development', '.env'],
    }),
    databaseConfig(),
    databaseConfigForFeature(),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '120s' },
      }),
    }),
  ],
  controllers: [AppController, UserController, AuthController, EventController, GenderController, CategoryController],
  providers: [AppService, UserService, AuthService, JWTConstants, UtilsService, EventService, GenderService, CategoryService],
})
export class AppModule {}

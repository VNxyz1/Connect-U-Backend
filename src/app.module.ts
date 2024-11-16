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
import { SocketGateway } from './socket/socket.gateway';
import { EventController } from './event/event.controller';
import { GenderController } from './gender/gender.controller';
import { CategoryController } from './category/category.controller';
import { EventService } from './event/event.service';
import { GenderService } from './gender/gender.service';
import { CategoryService } from './category/category.service';
import { RequestController } from './request/request.controller';
import { RequestService } from './request/request.service';

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
  controllers: [
    AppController,
    UserController,
    AuthController,
    EventController,
    GenderController,
    CategoryController,
    RequestController,
  ],
  providers: [
    AppService,
    UserService,
    AuthService,
    JWTConstants,
    UtilsService,
    SocketGateway,
    EventService,
    GenderService,
    CategoryService,
    RequestService,
  ],
})
export class AppModule {}

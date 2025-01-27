import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
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
import { staticDeploymentModule } from './static-delivery.config';
import { UserMiddleware } from './utils/user.middleware';
import { ListService } from './list/list.service';
import { ListController } from './list/list.controller';
import { ListEntryController } from './listEntry/listEntry.controller';
import { ListEntryService } from './listEntry/listEntry.service';
import { SurveyService } from './survey/survey.service';
import { SurveyController } from './survey/survey.controller';
import { TagService } from './tag/tag.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { TagController } from './tag/tag.controller';
import { MessageController } from './Message/message.controller';
import { MessageService } from './Message/message.service';
import { FriendService } from './friend/friend.service';
import { FriendsController } from './friend/friend.controller';
import { PushNotificationService } from './push-notification/push-notification.service';
import { InitSeeder } from './database/seeding/init.seeder';
import { CityController } from './API/city.controller';
import { CityService } from './API/city.service';
import { PushNotificationController } from './push-notification/push-notification.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvVars: false,
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.development', '.env'],
    }),
    databaseConfig(),
    databaseConfigForFeature(),
    staticDeploymentModule(),
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
    ListController,
    ListEntryController,
    SurveyController,
    TagController,
    MessageController,
    FriendsController,
    CityController,
    PushNotificationController,
  ],
  providers: [
    UserService,
    AuthService,
    JWTConstants,
    UtilsService,
    SocketGateway,
    EventService,
    GenderService,
    CategoryService,
    RequestService,
    ListService,
    ListEntryService,
    SurveyService,
    TagService,
    SchedulerService,
    MessageService,
    FriendService,
    PushNotificationService,
    InitSeeder,
    CityService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(UserMiddleware).forRoutes({
      path: '**',
      method: RequestMethod.ALL,
    });
  }
}

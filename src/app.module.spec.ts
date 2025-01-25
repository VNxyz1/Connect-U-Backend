import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';
import { EventService } from './event/event.service';
import { UtilsService } from './utils/utils.service';
import { AppController } from './app.controller';

describe('AppModule', () => {
  let app: TestingModule;

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should have the AppController', () => {
    const appController = app.get<AppController>(AppController);
    expect(appController).toBeDefined();
  });

  it('should have the UserService', () => {
    const userService = app.get<UserService>(UserService);
    expect(userService).toBeDefined();
  });

  it('should have the EventService', () => {
    const eventService = app.get<EventService>(EventService);
    expect(eventService).toBeDefined();
  });

  it('should have the UtilsService', () => {
    const utilsService = app.get<UtilsService>(UtilsService);
    expect(utilsService).toBeDefined();
  });
});

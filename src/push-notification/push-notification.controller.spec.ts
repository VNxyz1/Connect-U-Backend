import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationController } from './push-notification.controller';
import { mockProviders } from '../../test/mock-services';
import { mockPushNotificationRecord } from './push-notification.service.spec';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Agent } from 'supertest';
import { mockAuthService } from '../auth/auth.service.spec';

describe('PushNotificationController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushNotificationController],
      providers: [...mockProviders],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    agent = request.agent(app.getHttpServer());
    await app.init();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(agent).toBeDefined();
  });

  describe('getChatPushNotificationsHost', () => {
    it('getUnreadMessagesMapHost gets called', async () => {
      const tokens = await mockAuthService.signIn();

      return agent
        .get('/push-notification/chat/host')
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect(mockPushNotificationRecord);
    });
  });

  describe('getChatPushNotificationsParticipant', () => {
    it('getUnreadMessagesMapParticipant gets called', async () => {
      const tokens = await mockAuthService.signIn();

      return agent
        .get('/push-notification/chat/participant')
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect(mockPushNotificationRecord);
    });
  });

  describe('getPushNotificationsEventJoinRequests', () => {
    it('getJoinRequestsOfHost gets called', async () => {
      const tokens = await mockAuthService.signIn();

      return agent
        .get('/push-notification/event-join-requests')
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect(mockPushNotificationRecord);
    });
  });
});

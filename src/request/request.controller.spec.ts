import * as request from 'supertest';
import { Agent } from 'supertest';
import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { JWTConstants } from '../auth/constants';
import { AuthService } from '../auth/auth.service';
import { mockAuthService } from '../auth/auth.service.spec';
import { mockProviders } from '../../test/mock-services';
import { UtilsService } from '../utils/utils.service';
import { RequestController } from './request.controller';
import { mockRequestService } from './request.service.spec';
import { MockPublicEvent } from '../event/event.controller.spec';
import { EventService } from '../event/event.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventDB } from '../database/EventDB';
import { mockEventRepository } from '../event/event.service.spec';
import { SocketGateway } from '../socket/socket.gateway';

describe('RequestController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RequestController],
      providers: [
        ...mockProviders,
        SocketGateway,
        UtilsService,
        {
          provide: getRepositoryToken(EventDB),
          useValue: mockEventRepository,
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockReturnValue({
              sub: 'uuIdMock',
              username: 'testUser',
              email: 'test@email.com',
            }),
          },
        },
        {
          provide: JWTConstants,
          useValue: {
            getConstants: jest.fn().mockReturnValue({ secret: 'seret_token' }),
          },
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
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

  describe('RequestController - create a join request for an event', () => {
    it('should create a join request for an event', async () => {
      const tokens = await mockAuthService.signIn();
      const eventId = '123';

      jest
        .spyOn(app.get(EventService), 'getEventById')
        .mockResolvedValue(MockPublicEvent);

      return agent
        .post(`/request/join/${eventId}`)
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CREATED)
        .expect({ ok: true, message: 'Request was sent' });
    });
  });

  describe('RequestController - fetch all requests sent by a specific user', () => {
    it('should fetch all requests sent by a specific user', async () => {
      const tokens = await mockAuthService.signIn();

      mockRequestService.getJoinRequestsByUser.mockResolvedValue([
        {
          id: 1,
          denied: false,
          event: {
            id: '123',
            name: 'Sample Event',
            host: { id: 'host123', username: 'hostUser' },
          },
        },
      ]);

      return agent
        .get('/request/join/user')
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect([
          {
            id: 1,
            event: { id: '123' },
            denied: false,
          },
        ]);
    });
  });

  describe('RequestController - fetch all join requests for a specific event', () => {
    it('should fetch all join requests for a specific event', async () => {
      const tokens = await mockAuthService.signIn();
      const eventId = '123';

      mockRequestService.getJoinRequestsForEvent.mockResolvedValue([
        {
          id: 1,
          denied: false,
          user: { id: 'user123', username: 'userTest' },
        },
      ]);

      return agent
        .get(`/request/join/event/${eventId}`)
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect([
          {
            id: 1,
            denied: false,
            user: {
              id: 'user123',
              isUser: false,
              username: 'userTest',
              age: null,
            },
          },
        ]);
    });
  });

  describe('RequestController - accept a join request', () => {
    it('should accept a join request and add the user to the event', async () => {
      const tokens = await mockAuthService.signIn();
      const requestId = 1;

      return agent
        .patch(`/request/accept/${requestId}`)
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect({ ok: true, message: 'Request successfully accepted' });
    });
  });

  describe('RequestController - deny a join request', () => {
    it('should deny a join request', async () => {
      const tokens = await mockAuthService.signIn();
      const requestId = 1;

      return agent
        .patch(`/request/deny/${requestId}`)
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect({ ok: true, message: 'Request successfully denied' });
    });
  });

  describe('RequestController - delete a join request', () => {
    it('should delete a join request', async () => {
      const tokens = await mockAuthService.signIn();
      const requestId = 1;

      return agent
        .delete(`/request/delete/${requestId}`)
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect({ ok: true, message: 'Request successfully deleted' });
    });
  });

  describe('RequestController - fetch all invitations for a specific event', () => {
    it('should fetch all invitations for a specific event', async () => {
      const tokens = await mockAuthService.signIn();
      const eventId = '123';

      mockRequestService.getInvitationsForEvent.mockResolvedValue([
        {
          id: 1,
          denied: false,
          user: { id: 'user123', username: 'userTest' },
        },
      ]);

      return agent
        .get(`/request/invite/event/${eventId}`)
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect([
          {
            id: 1,
            denied: false,
            user: {
              id: 'user123',
              isUser: false,
              username: 'userTest',
              age: null,
            },
          },
        ]);
    });
  });

  describe('RequestController - delete an invitation sent by the user', () => {
    it('should delete an invitation sent by the user', async () => {
      const tokens = await mockAuthService.signIn();
      const requestId = 1;

      return agent
        .delete(`/request/invite/${requestId}`)
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect({ ok: true, message: 'Invitation successfully deleted' });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('RequestController - fetch all invitations for a specific user', () => {
    it('should fetch all invitations for a specific user', async () => {
      const tokens = await mockAuthService.signIn();

      mockRequestService.getInvitationsByUser.mockResolvedValue([
        {
          id: 1,
          denied: false,
          event: {
            id: '123',
            name: 'Sample Event',
            host: { id: 'host123', username: 'hostUser' },
          },
        },
      ]);

      return agent
        .get('/request/invite/user')
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect([
          {
            id: 1,
            event: { id: '123' },
            denied: false,
          },
        ]);
    });
  });

  describe('RequestController - accept an invitation', () => {
    it('should accept an invitation and add the user to the event', async () => {
      const tokens = await mockAuthService.signIn();
      const invitationId = 1;

      return agent
        .patch(`/request/acceptInvite/${invitationId}`)
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect({ ok: true, message: 'Invitation successfully accepted' });
    });
  });

  describe('RequestController - deny an invitation', () => {
    it('should deny an invitation', async () => {
      const tokens = await mockAuthService.signIn();
      const invitationId = 1;

      return agent
        .patch(`/request/denyInvite/${invitationId}`)
        .set('Authorization', `Bearer ${tokens.access_token}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect({ ok: true, message: 'Invitation successfully denied' });
    });
  });
});

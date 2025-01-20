import * as request from 'supertest';
import { Agent } from 'supertest';
import {
  HttpStatus,
  INestApplication,
  BadRequestException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { AuthService } from '../auth/auth.service';
import { UtilsService } from '../utils/utils.service';
import { mockAuthService } from '../auth/auth.service.spec';
import { mockUtilsService } from '../utils/utils.service.spec';
import { CreateMessageDTO } from './DTO/CreateMessageDTO';
import { JwtService } from '@nestjs/jwt';
import { mockProviders } from '../../test/mock-services';
import { SocketGateway } from '../socket/socket.gateway';
import { mockMessageService } from './message.service.spec';

describe('MessageController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        SocketGateway,
        ...mockProviders,
        {
          provide: MessageService,
          useValue: mockMessageService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
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
          provide: UtilsService,
          useValue: mockUtilsService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  const tokens = { refresh_token: 'mock_refresh_token' };
  const mockEventId = 'event123';
  const mockUserId = 'user123';

  const mockMessage = {
    id: 1,
    text: 'Hello everyone!',
    timestamp: new Date().toISOString(),
    writer: { id: mockUserId, username: 'testUser' },
    unreadUsers: [{ id: 'user456' }],
  };

  describe('POST /:eventId/message - createMessage', () => {
    it('should create a message successfully', async () => {
      const createMessageDTO: CreateMessageDTO = { content: 'Hello everyone!' };

      jest
        .spyOn(mockMessageService, 'createMessage')
        .mockResolvedValue(mockMessage);

      return agent
        .post(`/message/${mockEventId}/message`)
        .send(createMessageDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'Message was posted successfully',
          });
        });
    });

    it('should return 400 if message contains a link', async () => {
      const createMessageDTO: CreateMessageDTO = {
        content: 'Check this link: https://example.com',
      };

      jest
        .spyOn(mockMessageService, 'createMessage')
        .mockRejectedValue(
          new BadRequestException('Messages cannot contain links.'),
        );

      return agent
        .post(`/message/${mockEventId}/message`)
        .send(createMessageDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toBe('Messages cannot contain links.');
        });
    });
  });

  describe('GET /:eventId - getEventChat', () => {
    it('should return the event chat with read and unread messages', async () => {
      const mockEventChat = {
        readMessages: [mockMessage],
        unreadMessages: [],
      };

      jest
        .spyOn(mockMessageService, 'getEventChat')
        .mockResolvedValue({ messages: [mockMessage], hostId: mockUserId });
      jest
        .spyOn(mockUtilsService, 'transformEventChatToGetEventChatDTO')
        .mockReturnValue(mockEventChat);

      return agent
        .get(`/message/${mockEventId}`)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual(mockEventChat);
        });
    });
  });

  describe('POST /:eventId/read - markMessagesAsRead', () => {
    it('should mark unread messages as read successfully', async () => {
      jest
        .spyOn(mockMessageService, 'markMessagesAsRead')
        .mockResolvedValue(undefined);

      return agent
        .post(`/message/${mockEventId}/read`)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'Unread messages have been marked as read.',
          });
        });
    });
  });
});

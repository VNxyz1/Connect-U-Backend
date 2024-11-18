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

describe('RequestController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RequestController],
      providers: [
        ...mockProviders,
        UtilsService,
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

  it('should create a join request for an event', async () => {
    const tokens = await mockAuthService.signIn();
    const eventId = '123';

    return agent
      .post(`/request/join/${eventId}`)
      .set('Authorization', `Bearer ${tokens.access_token}`)
      .expect('Content-Type', /json/)
      .expect(HttpStatus.CREATED)
      .expect({ ok: true, message: 'Request was sent' });
  });
});

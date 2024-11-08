import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  HttpStatus,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { mockAuthService } from './auth.service.spec';
import { Agent } from 'supertest';
import * as cookieParser from 'cookie-parser';

describe('AuthController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
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

  it('/POST login', async () => {
    const tokens = await mockAuthService.signIn();
    return agent
      .post('/auth/login')
      .send(mockLogin)
      .expect('Content-Type', /json/)
      .expect(HttpStatus.OK)
      .expect({ access_token: tokens.access_token });
  });

  it('/GET refresh', async () => {
    const tokens = await mockAuthService.signIn();
    return agent
      .get('/auth/refresh')
      .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
      .expect('Content-Type', /json/)
      .expect(HttpStatus.OK)
      .expect(await mockAuthService.refreshAccessToken(tokens.refresh_token));
  });

  it('should return 401 Unauthorized if refresh_token is missing', async () => {
    return agent
      .get('/auth/refresh')
      .expect('Content-Type', /json/)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token missing',
        error: 'Unauthorized',
      });
  });

  it('should return 401 Unauthorized if refresh_token is invalid', async () => {
    mockAuthService.refreshAccessToken = jest
      .fn()
      .mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

    return agent
      .get('/auth/refresh')
      .set('Cookie', ['refresh_token=invalid_token'])
      .expect('Content-Type', /json/)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid refresh token',
        error: 'Unauthorized',
      });
  });

  afterAll(async () => {
    await app.close();
  });
});

const mockLogin = {
  password: 'Passwort1234',
  email: 'test@gmail.com',
};

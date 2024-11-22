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
import { JwtService } from '@nestjs/jwt';
import { JWTConstants } from './constants';
import { AuthGuard } from './auth.guard';
import { UserService } from '../user/user.service';
import { mockProviders } from '../../test/mock-services';
import { CheckLoginRes } from './DTO/CheckLoginRes';
import { OkDTO } from '../serverDTO/OkDTO';
describe('AuthController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeEach(async () => {
    jest.clearAllMocks(); // Alle Mocks vor jedem Testlauf zurücksetzen

    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthGuard,
        mockProviders.find((provider) => provider.provide === UserService),
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
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

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

  describe('/POST login', () => {
    it('/POST login', async () => {
      mockAuthService.signIn = jest.fn().mockResolvedValue({
        access_token: 'valid_access_token',
        refresh_token: 'valid_refresh_token',
      });
      return agent
        .post('/auth/login')
        .send(mockLogin)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect({ access_token: 'valid_access_token' });
    });

    it('should return 401 Unauthorized if login credentials are incorrect', async () => {
      mockAuthService.signIn = jest
        .fn()
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      return agent
        .post('/auth/login')
        .send({ email: 'wrong@gmail.com', password: 'wrongpassword' })
        .expect('Content-Type', /json/)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid credentials',
          error: 'Unauthorized',
        });
    });
  });

  describe('/GET refresh', () => {
    it('/GET refresh', async () => {
      mockAuthService.refreshAccessToken = jest.fn().mockResolvedValue({
        access_token: 'valid_access_token',
      });

      return agent
        .get('/auth/refresh')
        .set('Cookie', ['refresh_token=valid_request_token'])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect({ access_token: 'valid_access_token' });
    });

    it('should return bad request when no cookie is set', async () => {
      return agent.get('/auth/refresh').expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/GET check-login', () => {
    it('/GET check-login', async () => {
      const validRes = new CheckLoginRes(true);

      return agent
        .get('/auth/check-login')
        .set('Cookie', ['refresh_token=valid_request_token'])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect(JSON.stringify(validRes));
    });

    it('should return false when the user has no active refresh-token as cookie', async () => {
      const validRes = new CheckLoginRes(false);

      return agent
        .get('/auth/check-login')
        .expect(HttpStatus.OK)
        .expect(JSON.stringify(validRes));
    });
  });

  describe('/DELETE logout', () => {
    it('/DELETE logout', async () => {
      mockAuthService.refreshAccessToken = jest.fn().mockResolvedValue({
        access_token: 'valid_access_token',
      });

      const validRes = new OkDTO(true, 'User is logged out.');

      return agent
        .delete('/auth/logout')
        .set('Cookie', ['refresh_token=valid_request_token'])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect(JSON.stringify(validRes));
    });

    it('should return okay, even when no cookie is set', async () => {
      const validRes = new OkDTO(true, 'User is logged out.');

      return agent
        .delete('/auth/logout')
        .expect(HttpStatus.OK)
        .expect(JSON.stringify(validRes));
    });
  });

  afterEach(async () => {
    await app.close();
  });
});

const mockLogin = {
  password: 'Passwort1234',
  email: 'test@gmail.com',
};

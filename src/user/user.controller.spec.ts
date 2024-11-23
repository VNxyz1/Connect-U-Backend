import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { mockUserService } from './user.service.spec';
import { CreateUserDTO } from './DTO/CreateUserDTO';
import { GenderEnum } from '../database/enums/GenderEnum';
import { UserController } from './user.controller';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { JWTConstants } from '../auth/constants';
import { mockAuthService } from '../auth/auth.service.spec';

describe('UserController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      imports: [],
      providers: [
        UserService,
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
    })
      .overrideProvider(UserService)
      .useValue(mockUserService)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  it('/POST user - should register successfully and set cookies', async () => {
    const tokens = {
      access_token: 'valid_access_token',
      refresh_token: 'valid_refresh_token',
    };

    jest.spyOn(mockUserService, 'createUser').mockResolvedValueOnce(undefined); // User wird erstellt
    jest.spyOn(mockAuthService, 'signIn').mockResolvedValueOnce(tokens); // Tokens werden generiert

    const response = await request(app.getHttpServer())
      .post('/user')
      .send(createMockUser)
      .expect('Content-Type', /json/)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({ access_token: tokens.access_token });

    // Prüfen, ob das Cookie korrekt gesetzt wurde
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('refresh_token=valid_refresh_token');
  });

  it('should return BadRequest, because a value is missing', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({
        ...createMockUser,
        username: '',
      })
      .expect('Content-Type', /json/)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          'Username cannot contain only whitespace',
          'username should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
  });

  afterAll(async () => {
    await app.close();
  });
});

const createMockUser: CreateUserDTO = {
  agb: true,
  email: 'test@gmail.com',
  username: 'testUser',
  password: 'Passwort1234',
  passwordConfirm: 'Passwort1234',
  firstName: 'firstName',
  lastName: 'lastName',
  birthday: '2002-08-06',
  gender: GenderEnum.Male,
};

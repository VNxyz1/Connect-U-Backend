import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
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
import { mockUtilsService } from '../utils/utils.service.spec';
import { UserDB } from '../database/UserDB';

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

    jest.spyOn(mockUserService, 'createUser').mockResolvedValueOnce(undefined);
    jest.spyOn(mockAuthService, 'signIn').mockResolvedValueOnce(tokens);

    const response = await request(app.getHttpServer())
      .post('/user')
      .send(createMockUser)
      .expect('Content-Type', /json/)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({ access_token: tokens.access_token });

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

  it('/GET userProfile/:userId - should return user profile', async () => {
    const expectedUserDB: UserDB = await mockUserService.findById('3');
    const mockUserProfile = {
      id: expectedUserDB.id,
      isUser: false,
      firstName: expectedUserDB.firstName,
      username: expectedUserDB.username,
      city: expectedUserDB.city,
      profilePicture: expectedUserDB.profilePicture,
      pronouns: expectedUserDB.pronouns,
      age: 24,
      profileText: expectedUserDB.profileText,
    };

    jest
      .spyOn(mockUserService, 'findById')
      .mockResolvedValueOnce(expectedUserDB);

    jest
      .spyOn(mockUtilsService, 'transformUserDBtoGetUserProfileDTO')
      .mockReturnValueOnce(mockUserProfile);

    const response = await request(app.getHttpServer())
      .get(`/user/userProfile/${expectedUserDB.id}`)
      .expect('Content-Type', /json/)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual(mockUserProfile);

    expect(mockUserService.findById).toHaveBeenCalledWith(expectedUserDB.id);
  });

  it('/PATCH userData - should update user data successfully', async () => {
    jest.spyOn(mockUserService, 'updateUser').mockResolvedValueOnce(undefined);

    const response = await request(app.getHttpServer())
      .patch('/user/userData')
      .set('Authorization', 'Bearer valid-token')
      .send({ email: 'new.email@example.com' })
      .expect('Content-Type', /json/)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      ok: true,
      message: 'user data was updated successfully',
    });
  });

  it('/PATCH userData - should return BadRequest for invalid user data', async () => {
    jest
      .spyOn(mockUserService, 'updateUser')
      .mockRejectedValueOnce(new BadRequestException('Invalid data'));

    const response = await request(app.getHttpServer())
      .patch('/user/userData')
      .set('Authorization', 'Bearer valid-token')
      .send({
        firstName: '    ',
        email: 'invalid-email',
        birthday: '15-06-1995',
      })
      .expect('Content-Type', /json/)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      statusCode: 400,
      message: [
        'First name cannot contain only whitespace',
        'email must be an email',
        'birthday must be a valid ISO 8601 date string',
      ],
      error: 'Bad Request',
    });
  });

  it('/PATCH password - should update password successfully', async () => {
    jest.spyOn(mockAuthService, 'validatePassword').mockResolvedValueOnce(true);
    jest
      .spyOn(mockUserService, 'updatePassword')
      .mockResolvedValueOnce(undefined);

    const response = await request(app.getHttpServer())
      .patch('/user/password')
      .set('Authorization', 'Bearer valid-token')
      .send({
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        newPasswordConfirm: 'NewPassword123',
      })
      .expect('Content-Type', /json/)
      .expect(HttpStatus.OK);

    expect(response.body).toEqual({
      ok: true,
      message: 'password was updated successfully',
    });
  });

  it('/PATCH password - should return BadRequest for mismatched passwords', async () => {
    const response = await request(app.getHttpServer())
      .patch('/user/password')
      .set('Authorization', 'Bearer valid-token')
      .send({
        oldPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        newPasswordConfirm: 'DifferentPassword123',
      })
      .expect('Content-Type', /json/)
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'New password and password confirmation must match',
      error: 'Bad Request',
    });
  });

  it('/PATCH password - should return NotFound for invalid old password', async () => {
    jest
      .spyOn(mockAuthService, 'validatePassword')
      .mockResolvedValueOnce(false);

    const response = await request(app.getHttpServer())
      .patch('/user/password')
      .set('Authorization', 'Bearer valid-token')
      .send({
        oldPassword: 'WrongOldPassword123',
        newPassword: 'NewPassword123',
        newPasswordConfirm: 'NewPassword123',
      })
      .expect('Content-Type', /json/)
      .expect(HttpStatus.NOT_FOUND);

    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Old password does not match',
      error: 'Not Found',
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

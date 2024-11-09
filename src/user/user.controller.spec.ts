import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { mockUserService } from './user.service.spec';
import { CreateUserDTO } from './DTO/CreateUserDTO';
import { GenderEnum } from '../database/enums/GenderEnum';
import { UserController } from './user.controller';
import { UtilsService } from '../utils/utils.service';

describe('UserController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      imports: [],
      providers: [UserService, UtilsService],
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

  it('/POST user', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send(createMockUser)
      .expect('Content-Type', /json/)
      .expect(HttpStatus.CREATED)
      .expect({ ok: true, message: 'User was created' });
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
        message: ['username should not be empty'],
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

import * as request from 'supertest';
import { Agent } from 'supertest';
import {
  HttpStatus,
  INestApplication,
  NotFoundException,
  ForbiddenException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { ListController } from './list.controller';
import { ListService } from './list.service';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListDB } from '../database/ListDB';
import { EventDB } from '../database/EventDB';
import { UserDB } from '../database/UserDB';
import { mockAuthService } from '../auth/auth.service.spec';
import { CreateListDTO } from './DTO/CreateListDTO';
import { GetListDetailsDTO } from './DTO/GetListDetailsDTO';
import { GetListDTO } from './DTO/GetListDTO';
import { AuthGuard } from '../auth/auth.guard';
import { JWTConstants } from '../auth/constants';
import { Repository } from 'typeorm';

describe('ListController', () => {
  let app: INestApplication;
  let agent: Agent;

  const mockUser = {
    id: '1',
    username: 'testUser',
  };

  const mockList = {
    id: 1,
    title: 'Test List',
    description: 'Test Description',
    creator: mockUser,
    listEntries: [],
    event: { id: '1', host: mockUser },
  };

  const mockListDetailsDTO: GetListDetailsDTO = {
    id: mockList.id,
    title: mockList.title,
    description: mockList.description,
    creator: {
      id: mockUser.id,
      username: mockUser.username,
      firstName: '',
      city: '',
      profilePicture: '',
      pronouns: '',
      age: 0,
      profileText: '',
    },
    listEntries: [],
  };

  const mockListsDTO: GetListDTO[] = [
    {
      id: mockList.id,
      title: mockList.title,
      description: mockList.description,
      creator: {
        id: mockUser.id,
        username: mockUser.username,
        firstName: '',
        city: '',
        profilePicture: '',
        pronouns: '',
        age: 0,
        profileText: '',
      },
    },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ListController],
      providers: [
        {
          provide: getRepositoryToken(ListDB),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(EventDB),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserDB),
          useClass: Repository,
        },
        {
          provide: ListService,
          useValue: {
            createList: jest.fn().mockResolvedValue(mockList),
            getListById: jest.fn().mockResolvedValue(mockList),
            getListsForEvent: jest.fn().mockResolvedValue([mockList]),
            deleteList: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: UtilsService,
          useValue: {
            isHostOrParticipant: jest.fn().mockResolvedValue(true),
            transformListDBtoGetListDetailsDTO: jest
              .fn()
              .mockResolvedValue(mockListDetailsDTO),
            transformListDBtoGetListDTO: jest
              .fn()
              .mockResolvedValue(mockListsDTO[0]),
          },
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
          provide: JWTConstants,
          useValue: {
            secret: 'test_secret',
          },
        },
        AuthGuard,
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

  describe('POST /:eventId - createList', () => {
    it('should create a new list for an event', async () => {
      const tokens = await mockAuthService.signIn();
      const createListDTO: CreateListDTO = {
        title: 'Test List',
        description: 'Test Description',
      };

      return agent
        .post('/list/1')
        .send(createListDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'List was created successfully',
            id: mockList.id,
          });
        });
    });

    it('should return 403 if the user is not allowed to create a list', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(UtilsService), 'isHostOrParticipant')
        .mockRejectedValue(new ForbiddenException('You are not allowed'));

      return agent
        .post('/list/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .send({ title: 'Test List', description: 'Test Description' })
        .expect(HttpStatus.FORBIDDEN)
        .expect((response) => {
          expect(response.body.message).toBe('You are not allowed');
        });
    });
  });

  describe('GET /listDetails/:listId - getListById', () => {
    it('should return a list by its ID', async () => {
      return agent
        .get('/list/listDetails/1')
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual(mockListDetailsDTO);
        });
    });

    it('should return 404 if the list is not found', async () => {
      jest
        .spyOn(app.get(ListService), 'getListById')
        .mockRejectedValue(new NotFoundException('List not found'));

      return agent
        .get('/list/listDetails/999')
        .expect(HttpStatus.NOT_FOUND)
        .expect((response) => {
          expect(response.body.message).toBe('List not found');
        });
    });
  });

  describe('DELETE /:listId - deleteList', () => {
    it('should delete a list', async () => {
      const tokens = await mockAuthService.signIn();

      return agent
        .delete('/list/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'List was deleted successfully',
          });
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

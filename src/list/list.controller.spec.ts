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
import { mockAuthService } from '../auth/auth.service.spec';
import { CreateListDTO } from './DTO/CreateListDTO';
import { GetListDetailsDTO } from './DTO/GetListDetailsDTO';
import { JWTConstants } from '../auth/constants';
import { mockProviders } from '../../test/mock-services';
import { mockListService } from './list.service.spec';
import { mockUtilsService } from '../utils/utils.service.spec';
import { mockUserList, mockUserService } from '../user/user.service.spec';

describe('ListController', () => {
  let app: INestApplication;
  let agent: Agent;

  const mockUser = {
    id: '1',
    username: 'testUser',
    firstName: 'test',
    city: 'giessen',
    profilePicture: 'string',
    pronouns: 'she/her',
    age: 23,
    profileText: 'eee',
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
      age: 23,
      username: mockUser.username,
      firstName: mockUser.firstName,
      city: mockUser.city,
      profilePicture: mockUser.profilePicture,
      pronouns: mockUser.pronouns,
      profileText: mockUser.profileText,
    },
    listEntries: [],
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ListController],
      providers: [
        ...mockProviders,
        {
          provide: ListService,
          useValue: mockListService,
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
        {
          provide: UtilsService,
          useValue: mockUtilsService,
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
            listId: mockList.id,
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
      const tokens = await mockAuthService.signIn();

      jest.spyOn(mockListService, 'getListById').mockResolvedValue(mockList);
      jest
        .spyOn(mockUtilsService, 'isHostOrParticipant')
        .mockResolvedValue(true);

      return agent
        .get('/list/listDetails/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual(mockListDetailsDTO);
        });
    });

    it('should return 404 if the list is not found', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(mockListService, 'getListById')
        .mockRejectedValue(new NotFoundException('List not found'));

      return agent
        .get('/list/listDetails/999')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.NOT_FOUND)
        .expect((response) => {
          expect(response.body.message).toBe('List not found');
        });
    });
  });

  describe('DELETE /:listId - deleteList', () => {
    it('should delete a list successfully when the user is authorized', async () => {
      const tokens = await mockAuthService.signIn();

      jest.spyOn(mockListService, 'getListById').mockResolvedValue(mockList);
      jest.spyOn(mockUserService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(mockListService, 'deleteList').mockResolvedValue(undefined);

      return agent
        .delete('/list/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'List was deleted successfully',
          });
          expect(mockListService.deleteList).toHaveBeenCalledWith(mockList);
        });
    });

    it('should return 403 if the user is not the creator or host', async () => {
      const tokens = await mockAuthService.signIn();

      jest.spyOn(mockListService, 'getListById').mockResolvedValue(mockList);
      jest
        .spyOn(mockUserService, 'findById')
        .mockResolvedValue(mockUserList[2]);

      return agent
        .delete('/list/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.FORBIDDEN)
        .expect((response) => {
          expect(response.body.message).toBe(
            'You are not allowed to delete this list',
          );
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

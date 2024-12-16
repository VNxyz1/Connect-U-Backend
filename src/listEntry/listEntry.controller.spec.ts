import * as request from 'supertest';
import { Agent } from 'supertest';
import {
  HttpStatus,
  BadRequestException,
  INestApplication,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { ListEntryController } from './listEntry.controller';
import { ListEntryService } from './listEntry.service';
import { ListService } from '../list/list.service';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { mockAuthService } from '../auth/auth.service.spec';
import { mockListService } from '../list/list.service.spec';
import { mockUtilsService } from '../utils/utils.service.spec';
import { CreateListEntryDTO } from './DTO/CreateListEntryDTO';
import { mockProviders } from '../../test/mock-services';
import { mockListEntryService } from './listEntry.service.spec';
import { SocketGateway } from '../socket/socket.gateway';

describe('ListEntryController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ListEntryController],
      providers: [
        SocketGateway,
        ...mockProviders,
        {
          provide: ListEntryService,
          useValue: mockListEntryService,
        },
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
    await app.init();
    agent = request.agent(app.getHttpServer());
  });

  describe('POST /:listId - createListEntry', () => {
    it('should create a new list entry', async () => {
      const tokens = await mockAuthService.signIn();

      const createListEntryDTO: CreateListEntryDTO = {
        content: 'Test List Entry',
      };

      jest.spyOn(mockListService, 'getListById').mockResolvedValue(mockList);
      jest
        .spyOn(mockListEntryService, 'createListEntry')
        .mockResolvedValue(mockListEntry);

      return agent
        .post('/list-entry/1')
        .send(createListEntryDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'List Entry was created successfully',
          });
        });
    });

    it('should return 400 if the list entry already exists', async () => {
      const tokens = await mockAuthService.signIn();

      const createListEntryDTO: CreateListEntryDTO = {
        content: 'Test List Entry',
      };

      jest.spyOn(mockListService, 'getListById').mockResolvedValue(mockList);
      jest
        .spyOn(mockListEntryService, 'createListEntry')
        .mockRejectedValue(
          new BadRequestException(
            'A list entry with the same description already exists.',
          ),
        );

      return agent
        .post('/list-entry/1')
        .send(createListEntryDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toBe(
            'A list entry with the same description already exists.',
          );
        });
    });
  });

  describe('PATCH /:listEntryId - addUserToListEntry', () => {
    it('should add user to list entry', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(mockListEntryService, 'getListEntryById')
        .mockResolvedValue(mockListEntry);
      jest
        .spyOn(mockListEntryService, 'updateListEntry')
        .mockResolvedValue(mockListEntry);

      return agent
        .patch('/list-entry/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'List entry was updated successfully',
          });
        });
    });
    it('should return 403 if there is already a user assigned to the list entry', async () => {
      const tokens = await mockAuthService.signIn();

      const listEntryWithUser = {
        ...mockListEntry,
        user: mockUser,
      };

      jest
        .spyOn(mockListEntryService, 'getListEntryById')
        .mockResolvedValue(listEntryWithUser);
      jest
        .spyOn(mockListEntryService, 'updateListEntry')
        .mockRejectedValue(
          new ForbiddenException(
            'Another user is already assigned to this list entry.',
          ),
        );

      const createListEntryDTO: CreateListEntryDTO = {
        content: 'Test List Entry',
      };

      return agent
        .patch('/list-entry/1')
        .send(createListEntryDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.FORBIDDEN)
        .expect((response) => {
          expect(response.body.message).toBe(
            'Another user is already assigned to this list entry.',
          );
        });
    });
  });

  describe('DELETE /:listEntryId - deleteListEntry', () => {
    it('should delete a list entry successfully', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(mockListEntryService, 'getListEntryById')
        .mockResolvedValue(mockListEntry);
      jest
        .spyOn(mockListEntryService, 'deleteListEntry')
        .mockResolvedValue(undefined);

      return agent
        .delete('/list-entry/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'List entry was deleted successfully',
          });
        });
    });
  });
});

const mockUser = {
  id: '1',
  username: 'testUser',
  firstName: 'test',
  city: 'giessen',
  isUser: false,
  profilePicture: 'string',
  pronouns: 'she/her',
  age: 23,
  profileText: 'eee',
};

export const mockList = {
  id: 1,
  title: 'Test List',
  description: 'Test Description',
  creator: mockUser,
  listEntries: [],
  event: { id: '1', host: mockUser },
};

export const mockListEntry = {
  id: 1,
  content: 'Test List Entry',
  list: mockList,
  user: null,
};

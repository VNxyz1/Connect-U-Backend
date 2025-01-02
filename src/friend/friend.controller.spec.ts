import * as request from 'supertest';
import { Agent } from 'supertest';
import {
  HttpException,
  HttpStatus,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { mockAuthService } from '../auth/auth.service.spec';
import { mockUtilsService } from '../utils/utils.service.spec';
import { mockProviders } from '../../test/mock-services';
import { FriendsController } from './friend.controller';
import { FriendService } from './friend.service';
import { mockFriendService } from './friend.service.spec';

describe('FriendsController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FriendsController],
      providers: [
        ...mockProviders,
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
          provide: FriendService,
          useValue: mockFriendService,
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

  describe('PUT /:friendId - createFriend', () => {
    it('should add a friend successfully', async () => {
      const tokens = await mockAuthService.signIn();

      jest.spyOn(mockFriendService, 'createFriend').mockResolvedValue({
        success: true,
        message: 'Friend was added',
      });

      return agent
        .put('/friends/2')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'Friend was added',
          });
        });
    });

    it('should return 400 if user tries to befriend themselves', async () => {
      const tokens = await mockAuthService.signIn();

      jest.spyOn(mockFriendService, 'createFriend').mockImplementation(() => {
        throw new HttpException(
          'You cannot befriend yourself',
          HttpStatus.BAD_REQUEST,
        );
      });

      return agent
        .put('/friends/uuIdMock')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toBe('You cannot befriend yourself');
        });
    });
  });

  describe('GET / - getFriends', () => {
    it('should return the list of friends', async () => {
      const tokens = await mockAuthService.signIn();
      jest
        .spyOn(mockFriendService, 'getFriends')
        .mockResolvedValue(mockFriends);

      return agent
        .get('/friends')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual(mockFriendsDTO);
        });
    });

    it('should return an empty list if no friends are found', async () => {
      const tokens = await mockAuthService.signIn();

      jest.spyOn(mockFriendService, 'getFriends').mockResolvedValue([]);

      return agent
        .get('/friends')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual([]);
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

const mockFriend1 = {
  id: '2',
  username: 'friend1',
  profilePicture: 'friend1.png',
  city: 'Berlin',
  pronouns: 'they/them',
  age: 23,
  profileText: 'Loves hiking and music',
};

const mockFriend2 = {
  id: '3',
  username: 'friend2',
  profilePicture: 'friend2.png',
  city: 'Munich',
  pronouns: 'he/him',
  age: 23,
  profileText: 'Avid gamer and coffee enthusiast',
};

const mockFriends = [mockFriend1, mockFriend2];

const mockFriendsDTO = mockFriends.map((friend) => ({
  id: friend.id,
  username: friend.username,
  profilePicture: friend.profilePicture,
  city: friend.city,
  pronouns: friend.pronouns,
  age: friend.age,
  profileText: friend.profileText,
  isUser: false,
}));

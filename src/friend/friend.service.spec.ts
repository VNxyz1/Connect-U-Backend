import { Test, TestingModule } from '@nestjs/testing';
import { FriendService } from './friend.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserDB } from '../database/UserDB';
import { NotFoundException } from '@nestjs/common';

describe('FriendService', () => {
  let service: FriendService;
  let userRepository: Repository<UserDB>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendService,
        {
          provide: getRepositoryToken(UserDB),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FriendService>(FriendService);
    userRepository = module.get<Repository<UserDB>>(getRepositoryToken(UserDB));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInviteLink', () => {
    it('should generate the correct invite link', () => {
      const protocol = 'https';
      const host = 'example.com';
      const username = 'testuser';
      const uuid = '1234-5678-91011';

      const link = service.createInviteLink(protocol, host, username, uuid);

      expect(link).toBe(`https://${host}/add-friend/${username}/${uuid}`);
    });
  });

  describe('setInviteLink', () => {
    it('should store a UUID with a default TTL of 5 minutes', () => {
      const username = 'testuser';
      const uuid = '1234-5678-91011';

      service.setInviteLink(username, uuid);
      const storedUUID = service.getActiveUUID(username);

      expect(storedUUID).toBe(uuid);
      expect(service.hasActiveUUID(username)).toBe(true);
    });

    it('should override an existing UUID and reset the TTL', () => {
      jest.useFakeTimers();
      const username = 'testuser';
      const firstUUID = '1234-5678-91011';
      const secondUUID = '2222-3333-4444';

      service.setInviteLink(username, firstUUID, 5000);
      service.setInviteLink(username, secondUUID, 5000);
      const storedUUID = service.getActiveUUID(username);

      expect(storedUUID).toBe(secondUUID);
      jest.runAllTimers();
      expect(service.hasActiveUUID(username)).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('getActiveUUID', () => {
    it('should return undefined if no UUID is stored', () => {
      const username = 'nonexistent';
      const storedUUID = service.getActiveUUID(username);

      expect(storedUUID).toBeUndefined();
    });

    it('should return the UUID if it exists', () => {
      const username = 'testuser';
      const uuid = '1234-5678-91011';

      service.setInviteLink(username, uuid);
      const storedUUID = service.getActiveUUID(username);

      expect(storedUUID).toBe(uuid);
    });
  });

  describe('hasActiveUUID', () => {
    it('should return false if no UUID is stored', () => {
      const username = 'nonexistent';

      expect(service.hasActiveUUID(username)).toBe(false);
    });

    it('should return true if a UUID is stored', () => {
      const username = 'testuser';
      const uuid = '1234-5678-91011';

      service.setInviteLink(username, uuid);

      expect(service.hasActiveUUID(username)).toBe(true);
    });
  });

  describe('createFriend', () => {
    it('should create a friendship between two users', async () => {
      const user = { id: '1', friends: [], friendOf: [] } as UserDB;
      const friend = { id: '2', friends: [], friendOf: [] } as UserDB;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(friend);
      jest.spyOn(userRepository, 'save').mockResolvedValueOnce(user);

      const updatedUser = await service.createFriend(user, '2');

      expect(updatedUser.friends).toContain(friend);
      expect(friend.friendOf).toContain(user);
    });

    it('should throw an error if the friend does not exist', async () => {
      const user = { id: '1', friends: [], friendOf: [] } as UserDB;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.createFriend(user, '2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw an error if the friend already exists in the friend list', async () => {
      const friend = { id: '2', friends: [], friendOf: [] } as UserDB;
      const user = { id: '1', friends: [friend], friendOf: [] } as UserDB;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(friend);

      await expect(service.createFriend(user, '2')).rejects.toThrow(
        'Friend already exists in the users friend list',
      );
    });
  });

  describe('getFriends', () => {
    it('should return all unique friends of a user', async () => {
      const friend1 = { id: '2' } as UserDB;
      const friend2 = { id: '3' } as UserDB;
      const user = {
        id: '1',
        friends: [friend1],
        friendOf: [friend2],
      } as UserDB;

      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(user);

      const friends = await service.getFriends('1');

      expect(friends).toHaveLength(2);
      expect(friends).toEqual(expect.arrayContaining([friend1, friend2]));
    });

    it('should throw an error if the user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.getFriends('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('TTL behavior', () => {
    it('should delete a UUID after the TTL expires', () => {
      jest.useFakeTimers();
      const username = 'testuser';
      const uuid = '1234-5678-91011';
      const ttl = 5000;

      service.setInviteLink(username, uuid, ttl);
      expect(service.hasActiveUUID(username)).toBe(true);

      jest.advanceTimersByTime(ttl);

      expect(service.hasActiveUUID(username)).toBe(false);

      jest.useRealTimers();
    });
  });
});

export const mockFriendService = {
  hasActiveUUID: jest.fn(),
  getActiveUUID: jest.fn().mockResolvedValue('valid-invite-id'),
  createFriend: jest.fn().mockResolvedValue({
    success: true,
    message: 'Friend was added',
  }),
  getFriends: jest.fn().mockResolvedValue([
    {
      id: '1',
      username: 'friendUser1',
      firstName: 'Friend',
      city: 'Berlin',
      profilePicture: 'profile1.jpg',
      pronouns: 'they/them',
      age: 25,
      profileText: 'Loves hiking and music',
    },
    {
      id: '2',
      username: 'friendUser2',
      firstName: 'Buddy',
      city: 'Munich',
      profilePicture: 'profile2.jpg',
      pronouns: 'he/him',
      age: 28,
      profileText: 'Avid gamer and coffee enthusiast',
    },
  ]),
  setInviteLink: jest.fn().mockResolvedValue('oi'),
  createInviteLink: jest
    .fn()
    .mockReturnValue('https://example.com/add-friend/alexjones'),
};

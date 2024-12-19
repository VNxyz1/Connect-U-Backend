import { Test, TestingModule } from '@nestjs/testing';
import { FriendService } from './friend.service';

describe('FriendService', () => {
  let service: FriendService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FriendService],
    }).compile();

    service = module.get<FriendService>(FriendService);
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

import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationService } from './push-notification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestDB } from '../database/RequestDB';
import { MessageDB } from '../database/MessageDB';
import { Repository } from 'typeorm';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let messageRepository: jest.Mocked<Repository<MessageDB>>;
  let requestRepository: jest.Mocked<Repository<RequestDB>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationService,
        {
          provide: getRepositoryToken(MessageDB),
          useValue: {
            find: jest.fn().mockResolvedValue(mockMessageArray),
          },
        },
        {
          provide: getRepositoryToken(RequestDB),
          useValue: {
            find: jest.fn().mockResolvedValue(mockRequestArray),
          },
        },
      ],
    }).compile();

    messageRepository = module.get(getRepositoryToken(MessageDB));
    requestRepository = module.get(getRepositoryToken(RequestDB));
    service = module.get<PushNotificationService>(PushNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUnreadMessagesMapHost', () => {
    it('messageRepository gets called', async () => {
      const res = await service.getUnreadMessagesMapHost('exampleId');

      expect(messageRepository.find).toHaveBeenCalledTimes(1);
      expect(res).toEqual(mockPushNotificationRecord);
    });
  });

  describe('getUnreadMessagesMapParticipant', () => {
    it('messageRepository gets called', async () => {
      const res = await service.getUnreadMessagesMapParticipant('exampleId');

      expect(messageRepository.find).toHaveBeenCalledTimes(1);
      expect(res).toEqual(mockPushNotificationRecord);
    });
  });

  describe('getJoinRequestsOfHost', () => {
    it('requestRepository gets called', async () => {
      const res = await service.getJoinRequestsOfHost('exampleId');

      expect(requestRepository.find).toHaveBeenCalledTimes(1);
      expect(res).toEqual(mockPushNotificationRecord);
    });
  });
});

const mockMessageArray: MessageDB[] = [
  {
    event: {
      id: '5dfa78d6-c09a-46cc-86b4-27a209b43cee',
    },
  },
  {
    event: {
      id: '5dfa78d6-c09a-46cc-86b4-27a209b43cee',
    },
  },
  {
    event: {
      id: 'e9802bf3-3099-42b3-b3ad-91709b9d579d',
    },
  },
  {
    event: {
      id: 'e9802bf3-3099-42b3-b3ad-91709b9d579d',
    },
  },
  {
    event: {
      id: 'e9802bf3-3099-42b3-b3ad-91709b9d579d',
    },
  },
  {
    event: {
      id: 'f4c1606e-307e-4112-b295-36d3039403e7',
    },
  },
  {
    event: {
      id: '059d9809-6acf-4003-840a-d652c5d4e147',
    },
  },
] as MessageDB[];

const mockRequestArray: RequestDB[] = [
  {
    event: {
      id: '5dfa78d6-c09a-46cc-86b4-27a209b43cee',
    },
  },
  {
    event: {
      id: '5dfa78d6-c09a-46cc-86b4-27a209b43cee',
    },
  },
  {
    event: {
      id: 'e9802bf3-3099-42b3-b3ad-91709b9d579d',
    },
  },
  {
    event: {
      id: 'e9802bf3-3099-42b3-b3ad-91709b9d579d',
    },
  },
  {
    event: {
      id: 'e9802bf3-3099-42b3-b3ad-91709b9d579d',
    },
  },
  {
    event: {
      id: 'f4c1606e-307e-4112-b295-36d3039403e7',
    },
  },
  {
    event: {
      id: '059d9809-6acf-4003-840a-d652c5d4e147',
    },
  },
] as RequestDB[];

export const mockPushNotificationRecord: Record<string, number> = {
  '5dfa78d6-c09a-46cc-86b4-27a209b43cee': 2,
  'e9802bf3-3099-42b3-b3ad-91709b9d579d': 3,
  'f4c1606e-307e-4112-b295-36d3039403e7': 1,
  '059d9809-6acf-4003-840a-d652c5d4e147': 1,
};

export const mockPushNotificationService = {
  getUnreadMessagesMapHost: jest
    .fn()
    .mockResolvedValue(mockPushNotificationRecord),
  getUnreadMessagesMapParticipant: jest
    .fn()
    .mockResolvedValue(mockPushNotificationRecord),
  getJoinRequestsOfHost: jest
    .fn()
    .mockResolvedValue(mockPushNotificationRecord),
};

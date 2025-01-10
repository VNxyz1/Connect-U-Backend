import { EventService } from './event.service';
import { Test, TestingModule } from '@nestjs/testing';
import { mockProviders } from '../../test/mock-services';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventDB } from '../database/EventDB';
import { CategoryDB } from '../database/CategoryDB';
import { GenderDB } from '../database/GenderDB';
import { UserDB } from '../database/UserDB';
import { CreateEventDTO } from './DTO/CreateEventDTO';
import { EventtypeEnum } from '../database/enums/EventtypeEnum';
import { GenderEnum } from '../database/enums/GenderEnum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatusEnum } from '../database/enums/StatusEnum';
import { In, Not, Repository } from 'typeorm';
import { SurveyEntryDB } from '../database/SurveyEntryDB';
import { ListEntryDB } from '../database/ListEntryDB';
import { SchedulerService } from '../scheduler/scheduler.service';
import { FilterDTO } from './DTO/FilterDTO';
import ViewedEventsDB from '../database/ViewedEventsDB';

export const mockEventRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
  })),
};

const mockCategoryList: CategoryDB[] = [
  { id: 1, name: 'Tech', germanName: 'Technologie', events: [] },
  { id: 2, name: 'Sports', germanName: 'Sport', events: [] },
];

const mockGenderList: GenderDB[] = [
  { id: 1, gender: GenderEnum.Diverse, events: [] },
  { id: 2, gender: GenderEnum.Male, events: [] },
];

const mockUser: UserDB = {
  id: 'uuIdMock',
  email: 'host@example.com',
  username: 'hostuser',
  password: 'hashedpassword',
  firstName: 'Host',
  lastName: 'User',
  birthday: '1980-01-01',
  phoneNumber: '+1234567890',
  profilePicture: 'profile.png',
  pronouns: 'he/him',
  profileText: 'Event organizer and tech enthusiast.',
  streetNumber: '123',
  street: 'Main St',
  zipCode: '12345',
  city: 'Anytown',
  isVerified: true,
  gender: 2,
  hostedEvents: [],
  requests: [],
  lists: [],
  surveys: [],
  participatedEvents: [],
  favoritedEvents: [],
  memories: [],
  friends: [],
  friendOf: [],
  listEntries: [],
  achievements: Promise.resolve([]),
  surveyEntries: [],
  messages: [],
  reactions: [],
  tags: [],
  unreadMessages: [],
  viewEvents: [],
};

const participantUser: UserDB = {
  id: 'uuIdMock2',
  email: 'participant@example.com',
  username: 'participantUser',
  password: 'hashedpassword',
  firstName: 'Host',
  lastName: 'User',
  birthday: '1980-01-01',
  phoneNumber: '+1234567890',
  profilePicture: 'profile.png',
  pronouns: 'he/him',
  profileText: 'Event organizer and tech enthusiast.',
  streetNumber: '123',
  street: 'Main St',
  zipCode: '12345',
  city: 'Anytown',
  isVerified: true,
  gender: 2,
  lists: [],
  surveys: [],
  hostedEvents: [],
  requests: [],
  participatedEvents: [],
  favoritedEvents: [],
  memories: [],
  friends: [],
  friendOf: [],
  listEntries: [],
  achievements: Promise.resolve([]),
  surveyEntries: [],
  messages: [],
  reactions: [],
  tags: [],
  unreadMessages: [],
  viewEvents: [],
};

const mockCreateEventDTO: CreateEventDTO = {
  categories: [],
  description: '',
  preferredGenders: [],
  dateAndTime: '2024-12-01T10:00:00',
  title: 'Tech Conference 2024',
  type: EventtypeEnum.halfPrivate,
  isOnline: false,
  showAddress: true,
  streetNumber: '456',
  street: 'Tech Ave',
  zipCode: '67890',
  city: 'Tech City',
  participantsNumber: 100,
  startAge: 18,
  endAge: 50,
};

const mockEventList: EventDB[] = [
  {
    id: '1',
    timestamp: '2022-12-01T10:00:00',
    title: 'Tech Conference 2024',
    description: 'A conference for tech enthusiasts.',
    dateAndTime: '2024-12-01T10:00:00',
    categories: mockCategoryList,
    host: mockUser,
    type: EventtypeEnum.halfPrivate,
    isOnline: false,
    showAddress: true,
    streetNumber: '456',
    street: 'Tech Ave',
    zipCode: '67890',
    city: 'Tech City',
    participantsNumber: 100,
    preferredGenders: mockGenderList,
    status: StatusEnum.upcoming,
    picture: '',
    startAge: 0,
    endAge: 0,
    participants: [participantUser],
    requests: [],
    surveys: [],
    lists: [],
    favorited: [],
    memories: [],
    tags: [],
    messages: [],
    viewEvents: [],
  },
  {
    id: '2',
    timestamp: '2022-12-01T10:00:00',
    title: 'Game Jam 2024',
    description: 'Game Jam to create awesome new games!',
    dateAndTime: '2024-12-01T10:00:00',
    categories: mockCategoryList,
    host: mockUser,
    type: EventtypeEnum.halfPrivate,
    isOnline: true,
    showAddress: true,
    streetNumber: '',
    street: '',
    zipCode: '',
    city: '',
    participantsNumber: 23,
    preferredGenders: mockGenderList,
    status: StatusEnum.upcoming,
    picture: '',
    startAge: 0,
    endAge: 0,
    participants: [],
    requests: [],
    lists: [],
    favorited: [],
    surveys: [],
    memories: [],
    tags: [],
    messages: [],
    viewEvents: [],
  },
];

const queryBuilderMock = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(mockEventList),
  orderBy: jest.fn().mockReturnThis(),
};

mockEventRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

describe('EventService', () => {
  let service: EventService;
  let listEntryRepository: Repository<ListEntryDB>;
  let surveyEntryRepository: Repository<SurveyEntryDB>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        ...mockProviders.filter(
          (provider) => provider.provide !== EventService,
          SchedulerService,
        ),
        {
          provide: getRepositoryToken(EventDB),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(ListEntryDB),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(SurveyEntryDB),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ViewedEventsDB),
          useClass: Repository,
        },
        {
          provide: SchedulerService,
          useValue: mockSchedulerService,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    listEntryRepository = module.get<Repository<ListEntryDB>>(
      getRepositoryToken(ListEntryDB),
    );
    surveyEntryRepository = module.get<Repository<SurveyEntryDB>>(
      getRepositoryToken(SurveyEntryDB),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new event', async () => {
    const newEvent = {
      ...mockCreateEventDTO,
      host: mockUser,
      categories: mockCategoryList,
      preferredGenders: mockGenderList,
    };

    mockEventRepository.create.mockReturnValue(newEvent);
    mockEventRepository.save.mockResolvedValue(newEvent);

    const result = await service.createEvent(
      mockUser,
      null,
      mockCategoryList,
      mockGenderList,
      mockCreateEventDTO,
    );

    expect(mockEventRepository.create).toHaveBeenCalledWith();
    expect(mockEventRepository.save).toHaveBeenCalledWith(newEvent);
    expect(mockSchedulerService.scheduleEventStatusUpdate).toHaveBeenCalledWith(
      newEvent,
    );
    expect(result).toEqual(newEvent);
  });

  it('should handle errors when creating an event', async () => {
    const newEvent = {
      ...mockCreateEventDTO,
      host: mockUser,
      categories: mockCategoryList,
      preferredGenders: mockGenderList,
    };

    mockEventRepository.create.mockReturnValue(newEvent);
    mockEventRepository.save.mockRejectedValue(new Error('Error saving event'));

    await expect(
      service.createEvent(
        mockUser,
        null,
        mockCategoryList,
        mockGenderList,
        mockCreateEventDTO,
      ),
    ).rejects.toThrowError('Error saving event');
  });

  describe('EventService - getEventById', () => {
    it('should return an event by its ID', async () => {
      const eventId = '1';
      const mockEvent = mockEventList.find((event) => event.id === eventId);
      mockEventRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.getEventById(eventId);

      expect(mockEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: eventId },
        relations: [
          'categories',
          'participants',
          'preferredGenders',
          'host',
          'tags',
        ],
      });
      expect(result).toEqual(mockEvent);
    });

    it('should throw a NotFoundException if the event is not found', async () => {
      const eventId = 'nonexistent-id';
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.getEventById(eventId)).rejects.toThrow(
        new NotFoundException(`Event with ID ${eventId} not found`),
      );

      expect(mockEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: eventId },
        relations: [
          'categories',
          'participants',
          'preferredGenders',
          'host',
          'tags',
        ],
      });
    });
  });

  it('should get all events', async () => {
    mockEventRepository.find.mockResolvedValue(mockEventList);

    const result = await service.getAllActiveEventsByPopularity();

    expect(mockEventRepository.find).toHaveBeenCalledWith({
      where: {
        status: Not(In([StatusEnum.cancelled, StatusEnum.finished])),
        type: Not(EventtypeEnum.private),
      },
      relations: {
        categories: true,
        participants: true,
        tags: true,
        viewEvents: true,
      },
      order: {
        viewEvents: {
          viewed: 'DESC',
        },
      },
      skip: 0,
      take: 12,
    });
    expect(result).toEqual(mockEventList);
  });

  it('should throw a NotFoundException if no events are found', async () => {
    mockEventRepository.find.mockResolvedValue([]);

    await expect(service.getAllActiveEventsByPopularity()).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('EventService - getHostingEvents', () => {
    it('should get events hosted by a specific user', async () => {
      mockEventRepository.find.mockResolvedValue(mockEventList);

      const result = await service.getHostingEvents(mockUser.id);

      expect(mockEventRepository.find).toHaveBeenCalledWith({
        where: { host: { id: mockUser.id } },
        relations: ['host', 'categories', 'participants', 'tags'],
        order: {
          dateAndTime: 'ASC',
        },
      });
      expect(result).toEqual(mockEventList);
    });
  });

  describe('EventService - getParticipatingEvents', () => {
    let queryBuilderMock;

    beforeEach(() => {
      queryBuilderMock = mockEventRepository.createQueryBuilder();
      jest.clearAllMocks();
    });

    it('should return participating events when the user is a participant', async () => {
      queryBuilderMock.where.mockReturnThis();
      queryBuilderMock.leftJoinAndSelect.mockReturnThis();
      queryBuilderMock.getMany.mockResolvedValue(mockEventList);

      const result = await service.getParticipatingEvents('uuIdMock2');

      expect(result).toEqual(mockEventList);
      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'participant.id = :userId',
        { userId: 'uuIdMock2' },
      );
      expect(queryBuilderMock.getMany).toHaveBeenCalled();
    });
  });

  describe('addUserToEvent', () => {
    it('should add user to event successfully', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEventList[1]);
      mockEventRepository.save.mockResolvedValue({
        ...mockEventList[1],
        participants: [participantUser],
      });

      const result = await service.addUserToEvent(participantUser, '2');

      expect(mockEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: '2' },
        relations: ['participants', 'host'],
      });
      expect(mockEventRepository.save).toHaveBeenCalledWith({
        ...mockEventList[1],
        participants: [participantUser],
      });
      expect(result.participants).toContain(participantUser);
    });

    it('should throw NotFoundException if event is not found', async () => {
      mockEventRepository.findOne.mockResolvedValue(null);

      await expect(service.addUserToEvent(mockUser, 'event1')).rejects.toThrow(
        new NotFoundException('Event with ID event1 not found'),
      );
    });

    it('should throw BadRequestException if user is the host of the event', async () => {
      mockEventRepository.findOne.mockResolvedValue(mockEventList[1]);

      await expect(service.addUserToEvent(mockUser, 'event1')).rejects.toThrow(
        new BadRequestException('user is the host of this event'),
      );
    });

    it('should throw BadRequestException if user is already a participant', async () => {
      mockEventRepository.findOne.mockResolvedValue({
        ...mockEventList[1],
        participants: [participantUser],
      });

      await expect(
        service.addUserToEvent(participantUser, 'event1'),
      ).rejects.toThrow(
        new BadRequestException('User is already a participant in this event'),
      );
    });
  });

  describe('EventService - getUpcoming events', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return participating events when the user is a participant', async () => {
      jest.spyOn(mockEventRepository, 'find').mockResolvedValue(mockEventList);

      const result = await service.getUpcomingAndLiveEvents('uuIdMock2');

      expect(result).toEqual(mockEventList);
      expect(mockEventRepository.find).toHaveBeenCalled();
    });

    it('should throw a NotFoundException when the user is not a participant in any events', async () => {
      jest.spyOn(mockEventRepository, 'find').mockResolvedValue([]);

      await expect(
        service.getUpcomingAndLiveEvents('uuIdMock'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUserFromEvent', () => {
    it('should remove a user from the event participants list', async () => {
      const mockEvent = {
        id: 'event-id',
        participants: [{ id: 'user-id' }],
        lists: [{ listEntries: [{ user: { id: 'user-id' } }] }],
        surveys: [{ surveyEntries: [{ users: [{ id: 'user-id' }] }] }],
      } as unknown as EventDB;

      const mockUser = { id: 'user-id' } as UserDB;

      mockEventRepository.findOne.mockResolvedValue(mockEvent);
      jest.spyOn(listEntryRepository, 'save').mockResolvedValue(undefined);
      jest.spyOn(surveyEntryRepository, 'save').mockResolvedValue(undefined);
      mockEventRepository.save.mockResolvedValue(mockEvent);

      const result = await service.removeUserFromEvent(mockUser, 'event-id');

      expect(mockEventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event-id' },
        relations: [
          'participants',
          'host',
          'lists.listEntries',
          'lists.listEntries.user',
          'surveys.surveyEntries',
          'surveys.surveyEntries.users',
        ],
      });
      expect(listEntryRepository.save).toHaveBeenCalledTimes(1);
      expect(surveyEntryRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventRepository.save).toHaveBeenCalledWith(mockEvent);
      expect(result.participants).toEqual([]);
    });

    it('should throw NotFoundException if the event does not exist', async () => {
      jest.spyOn(mockEventRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.removeUserFromEvent(
          { id: 'user-id' } as UserDB,
          'invalid-event-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if the user is not a participant', async () => {
      const mockEvent = {
        id: 'event-id',
        participants: [{ id: 'other-user-id' }],
      } as unknown as EventDB;

      jest.spyOn(mockEventRepository, 'findOne').mockResolvedValue(mockEvent);

      await expect(
        service.removeUserFromEvent({ id: 'user-id' } as UserDB, 'event-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('fyPageAlgo', () => {
    it('should return a EventDB array sorted by relevance', async () => {
      jest.spyOn(service, 'getHostingEvents').mockResolvedValue([]);
      jest.spyOn(service, 'getParticipatingEvents').mockResolvedValue([]);
      jest.spyOn(mockEventRepository, 'find').mockResolvedValue([]);

      const result = await service.fyPageAlgo(mockUser.id);

      expect(mockEventRepository.find).toBeCalledTimes(4);
      expect(result.length).toEqual(0);
    });
  });

  describe('EventService - getFilteredEvents', () => {
    it('should return events with no filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockEventList),
      };

      jest
        .spyOn(mockEventRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const filters: FilterDTO = {};

      const result = await service.getFilteredEvents(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'event.status = :status',
        {
          status: StatusEnum.upcoming,
        },
      );
      expect(result).toEqual(mockEventList);
    });

    it('should filter events by title', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockEventList),
      };

      jest
        .spyOn(mockEventRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const filters: FilterDTO = { title: 'Tech Conference' };

      const result = await service.getFilteredEvents(filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'event.title LIKE :title',
        {
          title: '%Tech Conference%',
        },
      );
      expect(result).toEqual(mockEventList);
    });

    it('should throw NotFoundException if no events match the filters', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(mockEventRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const filters: FilterDTO = { title: 'Nonexistent Event' };

      await expect(service.getFilteredEvents(filters)).rejects.toThrow(
        new NotFoundException('Events not found'),
      );
    });
  });
});

export const mockEventService = {
  findById: jest.fn().mockResolvedValue(mockCreateEventDTO[1]),
  createEvent: jest.fn().mockResolvedValue(new EventDB()),
  getEventById: jest.fn().mockResolvedValue(new EventDB()),
  getAllActiveEventsByPopularity: jest.fn().mockResolvedValue(mockEventList),
  getHostingEvents: jest.fn().mockResolvedValue(mockEventList),
  getParticipatingEvents: jest.fn().mockResolvedValue(mockEventList),
  addUserToEvent: jest.fn().mockResolvedValue(new EventDB()),
  getUpcomingAndLiveEvents: jest.fn().mockResolvedValue(mockEventList),
  removeUserFromEvent: jest.fn().mockResolvedValue(new EventDB()),
  fyPageAlgo: jest.fn().mockResolvedValue(mockEventList),
  getFriendsEvents: jest.fn().mockResolvedValue(mockEventList),
  setEventAsClicked: jest.fn().mockResolvedValue({}),
  friendMultiplier: jest.fn().mockResolvedValue(1),
  calculateRelevance: jest.fn().mockResolvedValue(2),
  calculateFrequencyMaps: jest
    .fn()
    .mockResolvedValue([new Map(), new Map(), new Map()]),
  getFilteredEvents: jest.fn().mockResolvedValue(mockEventList),
};

export const mockSchedulerService = {
  scheduleEventStatusUpdate: jest.fn().mockResolvedValue(new EventDB()),
};

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

const mockEventRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockCategoryList: CategoryDB[] = [
  { id: 1, name: 'Tech', events: [] },
  { id: 2, name: 'Sports', events: [] },
];

const mockGenderList: GenderDB[] = [
  { id: 1, gender: GenderEnum.Diverse, events: [] },
  { id: 2, gender: GenderEnum.Male, events: [] },
];

const mockUser: UserDB = {
  id: '1',
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
  participatedEvents: [],
  favoritedEvents: [],
  memories: [],
  friends: Promise.resolve([]),
  friendOf: Promise.resolve([]),
  listEntries: [],
  achievements: Promise.resolve([]),
  surveyEntries: Promise.resolve([]),
  messages: [],
  reactions: [],
  tags: [],
  unreadMessages: [],
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

describe('EventService', () => {
  let service: EventService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        ...mockProviders.filter(
          (provider) => provider.provide !== EventService,
        ),
        {
          provide: getRepositoryToken(EventDB),
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
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
      mockCategoryList,
      mockGenderList,
      mockCreateEventDTO,
    );

    expect(mockEventRepository.create).toHaveBeenCalledWith();
    expect(mockEventRepository.save).toHaveBeenCalledWith(newEvent);
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
        mockCategoryList,
        mockGenderList,
        mockCreateEventDTO,
      ),
    ).rejects.toThrowError('Error saving event');
  });
});

export const mockEventService = {
  findById: jest.fn().mockResolvedValue(mockCreateEventDTO[1]),
  createEvent: jest.fn().mockResolvedValue(new EventDB()),
};

import { UserDB } from '../database/UserDB';
import { GenderEnum } from '../database/enums/GenderEnum';
import { Test, TestingModule } from '@nestjs/testing';
import { mockProviders } from '../../test/mock-services';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        ...mockProviders.filter((provider) => provider.provide !== UserService),
        {
          provide: getRepositoryToken(UserDB),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

const mockUserList: UserDB[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    username: 'johndoe',
    password: 'hashedpassword123',
    firstName: 'John',
    lastName: 'Doe',
    birthday: '1990-01-15',
    phoneNumber: '+1234567890',
    profilePicture: 'profile1.png',
    pronouns: 'he/him',
    profileText: 'I love programming and outdoor adventures.',
    streetNumber: '123',
    street: 'Main St',
    zipCode: '12345',
    city: 'Anytown',
    isVerified: true,
    gender: GenderEnum.Male,
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
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    username: 'janesmith',
    password: 'hashedpassword456',
    firstName: 'Jane',
    lastName: 'Smith',
    birthday: '1985-06-25',
    phoneNumber: '+1987654321',
    profilePicture: 'profile2.png',
    pronouns: 'she/her',
    profileText: 'Passionate about design and photography.',
    streetNumber: '456',
    street: 'Second St',
    zipCode: '54321',
    city: 'Othertown',
    isVerified: false,
    gender: GenderEnum.Female,
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
  },
  {
    id: '3',
    email: 'alex.jones@example.com',
    username: 'alexjones',
    password: 'hashedpassword789',
    firstName: 'Alex',
    lastName: 'Jones',
    birthday: '2000-10-10',
    phoneNumber: '+1122334455',
    profilePicture: 'profile3.png',
    pronouns: 'they/them',
    profileText: 'Avid reader and aspiring writer.',
    streetNumber: '789',
    street: 'Third St',
    zipCode: '67890',
    city: 'Somecity',
    isVerified: true,
    gender: GenderEnum.Diverse,
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
  },
];

export const mockUserService = {
  findById: jest.fn().mockResolvedValue(mockUserList[2]),
  findByEmail: jest.fn().mockResolvedValue(mockUserList[1]),
  findByUsername: jest.fn().mockResolvedValue(mockUserList[1]),
  createUser: jest.fn().mockResolvedValue(mockUserList[0]),
};

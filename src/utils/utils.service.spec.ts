import { UtilsService } from './utils.service';
import { Test, TestingModule } from '@nestjs/testing';
import { EventDB } from '../database/EventDB';
import { GetEventCardDTO } from '../event/DTO/GetEventCardDTO';
import { UserDB } from '../database/UserDB';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockEventRepository } from '../event/event.service.spec';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilsService,
        {
          provide: getRepositoryToken(EventDB),
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAge', () => {
    it('should be accepted', () => {
      const validDate = new Date('2002-02-18');
      const ret = service.validateUserAge(validDate, 18);
      expect(ret).toEqual(true);
    });

    it('should be accepted closely', () => {
      const validDate = new Date();
      validDate.setFullYear(validDate.getFullYear() - 18);
      validDate.setMinutes(validDate.getMinutes() - 1);

      const ret = service.validateUserAge(validDate, 18);
      expect(ret).toEqual(true);
    });

    it('should be denied', () => {
      const unvalid = new Date();
      unvalid.setFullYear(unvalid.getFullYear() - 18);

      const ret = service.validateUserAge(unvalid, 21);
      expect(ret).toEqual(false);
    });

    it('should be denied closely', () => {
      const unvalid = new Date();
      unvalid.setFullYear(unvalid.getFullYear() - 18);
      unvalid.setHours(unvalid.getHours() + 24);

      const ret = service.validateUserAge(unvalid, 18);
      expect(ret).toEqual(false);
    });

    it('should calculate the correct number of participants', async () => {
      const result: GetEventCardDTO =
        await service.transformEventDBtoGetEventCardDTO(mockEvent as EventDB);
      expect(result.participantsNumber).toEqual(3);
      expect(result.maxParticipantsNumber).toEqual(10);
    });
  });

  const mockParticipants: UserDB[] = [
    {
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
      surveys: [],
      lists: [],
      tags: [],
      unreadMessages: [],
    },
    {
      id: '2',
      email: 'user2@example.com',
      username: 'user2',
      password: 'hashedpassword',
      firstName: 'User',
      lastName: 'Two',
      birthday: '1990-05-15',
      phoneNumber: '+1234567891',
      profilePicture: 'profile2.png',
      pronouns: 'they/them',
      profileText: 'Participant and coder.',
      streetNumber: '124',
      street: 'Side St',
      zipCode: '54321',
      city: 'Othertown',
      isVerified: true,
      gender: 1,
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
      surveys: [],
      lists: [],
      tags: [],
      unreadMessages: [],
    },
    {
      id: '3',
      email: 'user3@example.com',
      username: 'user3',
      password: 'hashedpassword',
      firstName: 'User',
      lastName: 'Three',
      birthday: '1995-03-20',
      phoneNumber: '+1234567892',
      profilePicture: 'profile3.png',
      pronouns: 'she/her',
      profileText: 'Participant and designer.',
      streetNumber: '125',
      street: 'Another St',
      zipCode: '67890',
      city: 'Yettown',
      isVerified: true,
      gender: 1,
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
      surveys: [],
      lists: [],
      tags: [],
      unreadMessages: [],
    },
  ];

  const mockEvent: Partial<EventDB> = {
    id: 'event1',
    categories: [],
    dateAndTime: new Date().toISOString(),
    title: 'Sample Event',
    picture: 'sample.jpg',
    status: 1,
    type: 2,
    isOnline: false,
    city: 'Sample City',
    participants: mockParticipants,
    participantsNumber: 10,
  };
});

export const mockUtilsService = {
  transformUserDBtoGetUserProfileDTO: jest.fn((user) => ({
    id: user.id,
    firstName: user.firstName,
    username: user.username,
    city: user.city,
    profilePicture: user.profilePicture,
    pronouns: user.pronouns,
    age: 23,
    profileText: user.profileText,
  })),

  transformUserDBtoGetUserDataDTO: jest.fn((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    city: user.city,
    streetNumber: user.streetNumber,
    birthday: user.birthday,
    gender: user.gender,
    street: user.street,
    zipCode: user.zipCode,
  })),

  transformListEntryDBtoGetListEntryDTO: jest.fn((entry) => ({
    id: entry.id,
    content: entry.content,
  })),

  transformListDBtoGetListDetailsDTO: jest.fn((list) => ({
    id: list.id,
    title: list.title,
    description: list.description,
    creator: mockUtilsService.transformUserDBtoGetUserProfileDTO(list.creator),
    listEntries: list.listEntries.map((entry) =>
      mockUtilsService.transformListEntryDBtoGetListEntryDTO(entry),
    ),
  })),

  isHostOrParticipant: jest.fn(() => true),
};

import { EventtypeEnum } from '../database/enums/EventtypeEnum';
import { RequestService } from './request.service';
import { Repository } from 'typeorm';
import { RequestDB } from '../database/RequestDB';
import { EventDB } from '../database/EventDB';
import { UserDB } from '../database/UserDB';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GenderEnum } from '../database/enums/GenderEnum';
import { StatusEnum } from '../database/enums/StatusEnum';

describe('RequestService', () => {
  let service: RequestService;
  let requestRepository: jest.Mocked<Repository<RequestDB>>;
  let eventRepository: jest.Mocked<Repository<EventDB>>;
  let userRepository: jest.Mocked<Repository<UserDB>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestService,
        { provide: getRepositoryToken(RequestDB), useValue: jest.fn() },
        { provide: getRepositoryToken(EventDB), useValue: jest.fn() },
        { provide: getRepositoryToken(UserDB), useValue: jest.fn() },
      ],
    }).compile();

    service = module.get<RequestService>(RequestService);
    requestRepository = module.get(getRepositoryToken(RequestDB));
    eventRepository = module.get(getRepositoryToken(EventDB));
    userRepository = module.get(getRepositoryToken(UserDB));

    requestRepository.findOne = jest.fn();
    eventRepository.save = jest.fn();
    requestRepository.create = jest.fn();
    requestRepository.remove = jest.fn();
    requestRepository.save = jest.fn();
    eventRepository.findOne = jest.fn();
    userRepository.findOne = jest.fn();
  });

  describe('RequestService - postJoinRequest', () => {
    it('should throw NotFoundException if event is not found', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(
        service.postJoinRequest('event123', 'user123'),
      ).rejects.toThrow(new NotFoundException('Event not found'));
    });

    it('should throw NotFoundException if user is not found', async () => {
      eventRepository.findOne.mockResolvedValue({
        id: 'event123',
        type: EventtypeEnum.halfPrivate,
        host: { id: 'host123' },
      } as EventDB);
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.postJoinRequest('event123', 'user123'),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('should throw an error if the host tries to send a join request to their own event', async () => {
      eventRepository.findOne.mockResolvedValue({
        id: 'event123',
        type: EventtypeEnum.halfPrivate,
        host: { id: 'user123' },
      } as EventDB);
      userRepository.findOne.mockResolvedValue({ id: 'user123' } as UserDB);

      await expect(
        service.postJoinRequest('event123', 'user123'),
      ).rejects.toThrow(
        new Error('Host cannot send a join request to their own event'),
      );
    });

    it('should throw an error if the event is not half-private', async () => {
      eventRepository.findOne.mockResolvedValue({
        id: 'event123',
        type: EventtypeEnum.public,
        host: { id: 'host123' },
      } as EventDB);
      userRepository.findOne.mockResolvedValue({ id: 'user123' } as UserDB);

      await expect(
        service.postJoinRequest('event123', 'user123'),
      ).rejects.toThrow(
        new Error('Join requests are only allowed for half-private events'),
      );
    });

    it('should throw an error if a request already exists', async () => {
      eventRepository.findOne.mockResolvedValue({
        id: 'event123',
        type: EventtypeEnum.halfPrivate,
        host: { id: 'host123' },
      } as EventDB);
      userRepository.findOne.mockResolvedValue({ id: 'user123' } as UserDB);
      requestRepository.findOne.mockResolvedValue({
        id: 1,
      } as RequestDB);

      await expect(
        service.postJoinRequest('event123', 'user123'),
      ).rejects.toThrow(new Error('Request already exists'));
    });

    it('should create and save a join request', async () => {
      const mockEvent = {
        id: 'event123',
        type: EventtypeEnum.halfPrivate,
        host: { id: 'host123' },
      } as EventDB;
      const mockUser = { id: 'user123' } as UserDB;
      const mockRequest = { id: 1 } as RequestDB;

      eventRepository.findOne.mockResolvedValue(mockEvent);
      userRepository.findOne.mockResolvedValue(mockUser);
      requestRepository.findOne.mockResolvedValue(null);
      requestRepository.create.mockReturnValue(mockRequest);
      requestRepository.save.mockResolvedValue(mockRequest);

      await service.postJoinRequest('event123', 'user123');

      expect(requestRepository.save).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('RequestService - getRequestsByUser', () => {
    it('should retrieve all requests made by a specific user', async () => {

      const mockRequest = {
        id: 1,
        type: 1,
        denied: false,
      } as RequestDB;

      userRepository.findOne.mockResolvedValue({
        ...mockUserList[2],
        requests: [mockRequest],
      });
      const result = await service.getRequestsByUser('3');

      expect(result).toContainEqual(mockRequest);
    });

    it('should return an empty array if the user has no join requests', async () => {
      const mockUser = { ...mockUserList[0], requests: [] };

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getRequestsByUser(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('RequestService - getRequestsForEvent', () => {
    it('should retrieve all non-denied requests for an event', async () => {

      eventRepository.findOne.mockResolvedValue(mockEventList[0]);

      const result = await service.getRequestsForEvent('1', '2');
      expect(result).toEqual(mockEventList[0].requests);
    });

    it('should throw NotFoundException if the event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.getRequestsForEvent('event123', 'host123')).rejects.toThrowError(NotFoundException);
    });

    it('should throw ForbiddenException if the logged-in user is not the host of the event', async () => {
      const mockEvent = mockEventList[0];
      mockEvent.host.id = 'host123';
      const mockRequest = {
        id: 1,
        user: mockUserList[0],
        type: 1,
        denied: false,
      } as RequestDB;

      eventRepository.findOne.mockResolvedValue(mockEvent);
      requestRepository.findOne.mockResolvedValue(mockRequest);

      await expect(service.getRequestsForEvent(mockEvent.id, 'differentUser')).rejects.toThrowError(ForbiddenException);
    });
  });

  describe('RequestService - acceptJoinRequest', () => {
    it('should accept a join request and add the user to participants', async () => {
      const mockEvent = {
        id: 'event123',
        host: { id: 'host123' },
        participants: [],
        participantsNumber: 5,
      } as EventDB;
      const mockRequest = {
        id: 1,
        user: { id: 'user123' },
        event: mockEvent,
        denied: false,
      } as RequestDB;

      eventRepository.findOne.mockResolvedValue(mockEvent);
      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.remove.mockResolvedValue(mockRequest);

      await service.acceptJoinRequest(1, 'host123');

      expect(mockEvent.participants).toContain(mockRequest.user);
      expect(requestRepository.remove).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw NotFoundException if the request does not exist', async () => {
      requestRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptJoinRequest(999, 'host123')).rejects.toThrowError(NotFoundException);
    });

    it('should throw NotFoundException if the event associated with the request does not exist', async () => {
      const mockRequest = { id: 1, event: null, denied: false } as RequestDB;

      requestRepository.findOne.mockResolvedValue(mockRequest);
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptJoinRequest(mockRequest.id, 'host123')).rejects.toThrowError(NotFoundException);
    });

    it('should throw BadRequestException if the request has already been denied', async () => {
      const mockHost = mockUserList[1];
      const mockEvent = mockEventList[0];
      const mockRequest = {
        id: 1,
        user: mockUserList[0],
        event: mockEvent,
        denied: true,
      } as RequestDB;

      requestRepository.findOne.mockResolvedValue(mockRequest);
      eventRepository.findOne.mockResolvedValue(mockEvent);

      await expect(service.acceptJoinRequest(mockRequest.id, mockHost.id)).rejects.toThrowError(BadRequestException);
    });

    it('should throw BadRequestException if the event has reached the maximum number of participants', async () => {
      const mockHost = mockUserList[1];
      const mockEvent = {
        id: 'event123',
        host: { id: 'host123' },
        participants: [{ id: 'user123' }, { id: 'user456' }],
        participantsNumber: 2,
      } as EventDB;
      const mockRequest = {
        id: 1,
        user: mockUserList[2],
        event: mockEvent,
        denied: false,
      } as RequestDB;

      requestRepository.findOne.mockResolvedValue(mockRequest);
      eventRepository.findOne.mockResolvedValue(mockEvent); // The event exists

      // Act & Assert: Expect BadRequestException to be thrown if the event is full
      await expect(service.acceptJoinRequest(mockRequest.id, mockHost.id)).rejects.toThrowError(BadRequestException);
    });
  });

  describe('RequestService - denyRequest', () => {
    it('should deny a join request', async () => {
      const mockEvent = { host: { id: 'host123' } } as EventDB;
      const mockRequest = { id: 1, event: mockEvent, denied: false } as RequestDB;

      eventRepository.findOne.mockResolvedValue(mockEvent);
      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.save.mockResolvedValue({ ...mockRequest, denied: true });

      await service.denyRequest(1, 'host123');

      expect(requestRepository.save).toHaveBeenCalledWith({ ...mockRequest, denied: true });
    });

    it('should throw NotFoundException if the request does not exist', async () => {
      requestRepository.findOne.mockResolvedValue(null);

      await expect(service.denyRequest(999, 'host123')).rejects.toThrowError(NotFoundException);
    });

    it('should throw NotFoundException if the event associated with the request does not exist', async () => {
      const mockRequest = { id: 1, event: null, denied: false } as RequestDB;

      requestRepository.findOne.mockResolvedValue(mockRequest);
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.denyRequest(mockRequest.id, 'host123')).rejects.toThrowError(NotFoundException);
    });
  });

  describe('RequestService - deleteJoinRequest', () => {
    it('should delete a join request', async () => {
      const mockRequest = { id: 1, user: { id: 'user123' } } as RequestDB;

      requestRepository.findOne.mockResolvedValue(mockRequest);
      requestRepository.remove.mockResolvedValue(mockRequest);

      await service.deleteJoinRequest(1, 'user123');
      expect(requestRepository.remove).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw NotFoundException if the request does not exist', async () => {
      requestRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteJoinRequest(999, '3')).rejects.toThrowError(NotFoundException);
    });
  });
});

export const mockRequestService = {
  postJoinRequest: jest.fn().mockResolvedValue(new RequestDB()),
};


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
    requests: [{ id: 1 } as RequestDB],
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


const mockEventList: EventDB[] = [
  {
    id: '1',
    title: 'Tech Conference 2024',
    description: 'A conference for tech enthusiasts.',
    dateAndTime: '2024-12-01T10:00:00',
    categories: [],
    host: mockUserList[1],
    type: EventtypeEnum.halfPrivate,
    isOnline: false,
    showAddress: true,
    streetNumber: '456',
    street: 'Tech Ave',
    zipCode: '67890',
    city: 'Tech City',
    participantsNumber: 100,
    preferredGenders: [],
    status: StatusEnum.upcoming,
    picture: '',
    startAge: 0,
    endAge: 0,
    participants: [],
    requests: [],
    surveys: [],
    lists: [],
    favorited: [],
    memories: [],
    tags: [],
    messages: [],
  },
  {
    id: '2',
    title: 'Game Jam 2024',
    description: 'Game Jam to create awesome new games!',
    dateAndTime: '2024-12-01T10:00:00',
    categories: [],
    host: mockUserList[1],
    type: EventtypeEnum.halfPrivate,
    isOnline: true,
    showAddress: true,
    streetNumber: '',
    street: '',
    zipCode: '',
    city: '',
    participantsNumber: 23,
    preferredGenders: [],
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
  },
];


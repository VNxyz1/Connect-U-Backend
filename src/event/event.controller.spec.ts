import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { UtilsService } from '../utils/utils.service';
import { CategoryService } from '../category/category.service';
import { GenderService } from '../gender/gender.service';
import { UserService } from '../user/user.service';
import { CreateEventDTO } from './DTO/CreateEventDTO';
import { OkDTO } from '../serverDTO/OkDTO';
import { EventtypeEnum } from '../database/enums/EventtypeEnum';
import { GetEventCardDTO } from './DTO/GetEventCardDTO';
import { StatusEnum } from '../database/enums/StatusEnum';

describe('EventController', () => {
  let eventController: EventController;
  let eventService: EventService;
  let categoryService: CategoryService;
  let genderService: GenderService;
  let userService: UserService;
  let utilsService: UtilsService;

  const mockUser = { username: 'testUser', id: 'userId' };

  const mockEvent: any = {
    id: '1',
    dateAndTime: '2024-12-15T18:00:00Z',
    title: 'Java-Programmierung für Anfänger',
    picture: 'empty.png',
    status: StatusEnum.upcoming,
    type: EventtypeEnum.public,
    isOnline: true,
    city: 'Berlin',
    categories: [],
    participantsNumber: 50,
    participants:[
      {
        id: '1',
        email: 'aaa@example.com',
        username: 'participant1',
        password: 'hashedpassword',
        firstName: 'a',
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
      },
      {  id: '2',
        email: 'bbb@example.com',
        username: 'participant2',
        password: 'hashedpassword',
        firstName: 'b',
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
        unreadMessages: [], }],
  };

  const transformedEvent: GetEventCardDTO = {
    id: '1',
    dateAndTime: '2024-12-15T18:00:00Z',
    title: 'Java-Programmierung für Anfänger',
    picture: 'empty.png',
    status: StatusEnum.upcoming,
    type: EventtypeEnum.public,
    isOnline: true,
    city: 'Berlin',
    participantsNumber: 2,
    maxParticipantsNumber: 50,
    categories: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: {
            createEvent: jest.fn(),
            getAllEvents: jest.fn().mockResolvedValue([mockEvent]),
          },
        },
        {
          provide: UtilsService,
          useValue: {
            transformEventDBtoGetEventCardDTO: jest.fn().mockResolvedValue(transformedEvent),
          },
        },
        {
          provide: CategoryService,
          useValue: {
            getCategoriesByIds: jest.fn().mockResolvedValue(['category1', 'category2']),
          },
        },
        {
          provide: GenderService,
          useValue: {
            getGendersByIds: jest.fn().mockResolvedValue(['male', 'female']),
          },
        },
        {
          provide: UserService,
          useValue: {
            findByUsername: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    eventController = module.get<EventController>(EventController);
    eventService = module.get<EventService>(EventService);
    categoryService = module.get<CategoryService>(CategoryService);
    genderService = module.get<GenderService>(GenderService);
    userService = module.get<UserService>(UserService);
    utilsService = module.get<UtilsService>(UtilsService);
  });

  describe('createEvent', () => {
    it('should create an event and return success response', async () => {
      const createEventDTO: CreateEventDTO = {
        categories: [1, 2],
        description: 'richtig cooles event yippee',
        preferredGenders: [2, 3],
        dateAndTime: '2024-12-01T10:00:00',
        title: 'Tech Conference 2024',
        type: EventtypeEnum.public,
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

      const result = await eventController.createEvent(createEventDTO);

      expect(userService.findByUsername).toHaveBeenCalledWith('testUser');
      expect(categoryService.getCategoriesByIds).toHaveBeenCalledWith(createEventDTO.categories);
      expect(genderService.getGendersByIds).toHaveBeenCalledWith(createEventDTO.preferredGenders);
      expect(eventService.createEvent).toHaveBeenCalledWith(
        mockUser,
        ['category1', 'category2'],
        ['male', 'female'],
        createEventDTO,
      );
      expect(result).toEqual(new OkDTO(true, 'Event was created'));
    });

    it('should create an online event without needing an address', async () => {
      const createEventDTO: CreateEventDTO = {
        categories: [1, 2],
        description: 'wir machen die Nacht durch',
        preferredGenders: [2, 3],
        dateAndTime: '2024-12-01T10:00:00',
        title: 'Age of Empires zocken',
        type: EventtypeEnum.public,
        isOnline: true,
        showAddress: true,
        streetNumber: '',
        street: '',
        zipCode: '',
        city: '',
        participantsNumber: 100,
        startAge: 18,
        endAge: 50,
      };

      const result = await eventController.createEvent(createEventDTO);

      expect(result).toEqual(new OkDTO(true, 'Event was created'));
    });

    it('should create a semi-public event', async () => {
      const createEventDTO: CreateEventDTO = {
        categories: [1, 2],
        description: 'Wir sind schüchtern. wer bist du?',
        preferredGenders: [2, 3],
        dateAndTime: '2024-12-01T10:00:00',
        title: 'Kennenlernen (oder auch nicht)',
        type: EventtypeEnum.halfPrivate,
        isOnline: true,
        showAddress: true,
        streetNumber: '',
        street: '',
        zipCode: '',
        city: '',
        participantsNumber: 100,
        startAge: 18,
        endAge: 50,
      };

      const result = await eventController.createEvent(createEventDTO);

      expect(result).toEqual(new OkDTO(true, 'Event was created'));
    });
  });

  describe('getOwnRequests', () => {
    it('should return a list of events for the user', async () => {
      const result = await eventController.getOwnRequests();

      expect(userService.findByUsername).toHaveBeenCalledWith('testUser');
      expect(eventService.getAllEvents).toHaveBeenCalledWith(mockUser);
      expect(utilsService.transformEventDBtoGetEventCardDTO).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual([transformedEvent]);
    });

    it('should handle errors', async () => {
      jest.spyOn(eventService, 'getAllEvents').mockRejectedValue(new Error('Failed to fetch events'));

      await expect(eventController.getOwnRequests()).rejects.toThrow('Failed to fetch events');
    });
  });
});

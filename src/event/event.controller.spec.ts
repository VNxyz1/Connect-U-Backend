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

describe('EventController', () => {
  let eventController: EventController;
  let eventService: EventService;
  let categoryService: CategoryService;
  let genderService: GenderService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: {
            createEvent: jest.fn(),
          },
        },
        {
          provide: UtilsService,
          useValue: {},
        },
        {
          provide: CategoryService,
          useValue: {
            getCategoriesByIds: jest
              .fn()
              .mockResolvedValue(['category1', 'category2']),
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
            findByUsername: jest
              .fn()
              .mockResolvedValue({ username: 'testUser', id: 'userId' }),
          },
        },
      ],
    }).compile();

    eventController = module.get<EventController>(EventController);
    eventService = module.get<EventService>(EventService);
    categoryService = module.get<CategoryService>(CategoryService);
    genderService = module.get<GenderService>(GenderService);
    userService = module.get<UserService>(UserService);
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
      expect(categoryService.getCategoriesByIds).toHaveBeenCalledWith(
        createEventDTO.categories,
      );
      expect(genderService.getGendersByIds).toHaveBeenCalledWith(
        createEventDTO.preferredGenders,
      );
      expect(eventService.createEvent).toHaveBeenCalledWith(
        { username: 'testUser', id: 'userId' },
        ['category1', 'category2'],
        ['male', 'female'],
        createEventDTO,
      );
      expect(result).toEqual(new OkDTO(true, 'Event was created'));
    });

    it('should throw create an online event without needing an address', async () => {
      jest.spyOn(userService, 'findByUsername').mockResolvedValueOnce(null);

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

    it('should create a semi public event', async () => {
      jest.spyOn(userService, 'findByUsername').mockResolvedValueOnce(null);

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
});

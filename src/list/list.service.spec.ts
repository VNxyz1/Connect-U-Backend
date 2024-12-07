import { Test, TestingModule } from '@nestjs/testing';
import { ListService } from './list.service';
import { Repository } from 'typeorm';
import { ListDB } from '../database/ListDB';
import { EventDB } from '../database/EventDB';
import { UserDB } from '../database/UserDB';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('ListService', () => {
  let listService: ListService;
  let listRepository: jest.Mocked<Repository<ListDB>>;
  let eventRepository: jest.Mocked<Repository<EventDB>>;

  const mockUser: UserDB = { id: '1', username: 'testUser' } as UserDB;
  const mockEvent: EventDB = {
    id: '1',
    host: mockUser,
    participants: [mockUser],
    lists: [],
  } as EventDB;
  const mockList: ListDB = {
    id: 1,
    title: 'Test List',
    description: 'Test Description',
    creator: mockUser,
    event: mockEvent,
    listEntries: [],
  } as ListDB;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListService,
        {
          provide: getRepositoryToken(ListDB),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EventDB),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    listService = module.get<ListService>(ListService);
    listRepository = module.get(getRepositoryToken(ListDB));
    eventRepository = module.get(getRepositoryToken(EventDB));
  });

  describe('createList', () => {
    it('should create a new list successfully', async () => {
      eventRepository.findOne.mockResolvedValue(mockEvent);
      listRepository.create.mockReturnValue(mockList);
      listRepository.save.mockResolvedValue(mockList);

      const result = await listService.createList(
        mockUser,
        '1',
        'Test List',
        'Test Description',
      );

      expect(eventRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['participants', 'host'],
      });

      expect(listRepository.create).toHaveBeenCalledWith();

      expect(listRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          creator: mockUser,
          event: mockEvent,
          title: 'Test List',
          description: 'Test Description',
        }),
      );

      expect(result).toEqual(mockList);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(
        listService.createList(mockUser, '1', 'Test List', 'Test Description'),
      ).rejects.toThrow(new NotFoundException('Event not found'));
    });
  });

  describe('getListById', () => {
    it('should retrieve a list by its ID', async () => {
      listRepository.findOne.mockResolvedValue(mockList);

      const result = await listService.getListById(1);

      expect(listRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['event', 'creator', 'listEntries', 'listEntries.user'],
      });
      expect(result).toEqual(mockList);
    });

    it('should throw NotFoundException if the list does not exist', async () => {
      listRepository.findOne.mockResolvedValue(null);

      await expect(listService.getListById(1)).rejects.toThrow(
        new NotFoundException('List not found'),
      );
    });
  });

  describe('getListsForEvent', () => {
    it('should retrieve all lists for an event', async () => {
      eventRepository.findOne.mockResolvedValue({
        ...mockEvent,
        lists: [mockList],
      });

      const result = await listService.getListsForEvent('1');

      expect(eventRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['lists', 'lists.creator', 'lists.listEntries'],
      });
      expect(result).toEqual([mockList]);
    });

    it('should throw NotFoundException if the event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(listService.getListsForEvent('1')).rejects.toThrow(
        new NotFoundException('Event not found'),
      );
    });
  });

  describe('deleteList', () => {
    it('should delete a list successfully', async () => {
      listRepository.remove.mockResolvedValue(undefined);

      await listService.deleteList(mockList);

      expect(listRepository.remove).toHaveBeenCalledWith(mockList);
    });
  });
});

const mockUser = {
  id: '1',
  isUser: false,
  username: 'testUser',
  firstName: 'test',
  city: 'giessen',
  profilePicture: 'string',
  pronouns: 'she/her',
  age: 23,
  profileText: 'eee',
};

const mockList = {
  id: 1,
  title: 'Test List',
  description: 'Test Description',
  creator: mockUser,
  listEntries: [],
  event: { id: '1', host: mockUser },
};

export const mockListService = {
  createList: jest.fn().mockResolvedValue(mockList),
  getListById: jest.fn().mockResolvedValue(mockList),
  getListsForEvent: jest.fn().mockResolvedValue(mockList),
  deleteList: jest.fn().mockResolvedValue(mockList),
};

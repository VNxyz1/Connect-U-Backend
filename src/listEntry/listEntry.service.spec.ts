import { Test, TestingModule } from '@nestjs/testing';
import { ListEntryService } from './listEntry.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListEntryDB } from '../database/ListEntryDB';
import { ListDB } from '../database/ListDB';
import { UserDB } from '../database/UserDB';
import { NotFoundException } from '@nestjs/common';
import { mockListEntry } from './listEntry.controller.spec';

describe('ListEntryService', () => {
  let service: ListEntryService;
  let listEntryRepository: jest.Mocked<Repository<ListEntryDB>>;
  let listRepository: jest.Mocked<Repository<ListDB>>;

  const mockList = { id: 1, title: 'Test List' } as ListDB;
  const mockUser = { id: '1', username: 'TestUser' } as UserDB;
  const mockListEntry = {
    id: 1,
    content: 'Test Content',
    list: mockList,
    user: null,
  } as ListEntryDB;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListEntryService,
        {
          provide: getRepositoryToken(ListEntryDB),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ListDB),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ListEntryService>(ListEntryService);
    listEntryRepository = module.get(getRepositoryToken(ListEntryDB));
    listRepository = module.get(getRepositoryToken(ListDB));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createListEntry', () => {
    it('should create and return a new list entry', async () => {
      listRepository.findOne.mockResolvedValue(mockList);
      listEntryRepository.create.mockReturnValue(mockListEntry);
      listEntryRepository.save.mockResolvedValue(mockListEntry);

      const result = await service.createListEntry(1, 'Test Content');

      expect(listRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(listEntryRepository.create).toHaveBeenCalledWith();
      expect(listEntryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          list: mockList,
          content: 'Test Content',
        }),
      );
      expect(result).toEqual(mockListEntry);
    });

    it('should throw NotFoundException if the list does not exist', async () => {
      listRepository.findOne.mockResolvedValue(null);

      await expect(service.createListEntry(1, 'Test Content')).rejects.toThrow(
        new NotFoundException('List with ID not found'),
      );
    });
  });

  describe('getListEntryById', () => {
    it('should return the list entry by ID', async () => {
      listEntryRepository.findOne.mockResolvedValue(mockListEntry);

      const result = await service.getListEntryById(1);

      expect(listEntryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['list', 'list.event', 'user'],
      });
      expect(result).toEqual(mockListEntry);
    });

    it('should throw NotFoundException if the list entry does not exist', async () => {
      listEntryRepository.findOne.mockResolvedValue(null);

      await expect(service.getListEntryById(1)).rejects.toThrow(
        new NotFoundException('List Entry not found'),
      );
    });
  });

  describe('updateListEntry', () => {
    it('should update and return the list entry', async () => {
      listEntryRepository.save.mockResolvedValue({
        ...mockListEntry,
        user: mockUser,
      });

      const result = await service.updateListEntry(mockListEntry, mockUser);

      expect(listEntryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
        }),
      );
      expect(result).toEqual({
        ...mockListEntry,
        user: mockUser,
      });
    });
  });

  describe('removeUserFromListEntry', () => {
    it('should remove the user from the list entry', async () => {
      listEntryRepository.save.mockResolvedValue({
        ...mockListEntry,
        user: null,
      });

      const result = await service.removeUserFromListEntry(mockListEntry);

      expect(listEntryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: null,
        }),
      );
      expect(result).toEqual({
        ...mockListEntry,
        user: null,
      });
    });
  });

  describe('deleteListEntry', () => {
    it('should delete the list entry', async () => {
      listEntryRepository.remove.mockResolvedValue(mockListEntry);

      await service.deleteListEntry(mockListEntry);

      expect(listEntryRepository.remove).toHaveBeenCalledWith(mockListEntry);
    });
  });
});

export const mockListEntryService = {
  createListEntry: jest.fn().mockResolvedValue(mockListEntry),
  getListEntryById: jest.fn().mockResolvedValue(mockListEntry),
  updateListEntry: jest.fn().mockResolvedValue(mockListEntry),
  removeUserFromListEntry: jest.fn().mockResolvedValue(mockListEntry),
  deleteListEntry: jest.fn().mockResolvedValue(mockListEntry),
};

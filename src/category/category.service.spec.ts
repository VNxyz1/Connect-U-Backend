import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoryDB } from '../database/CategoryDB';
import { NotFoundException } from '@nestjs/common';
import { mockProviders } from '../../test/mock-services';

const mockCategoryRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  find: jest.fn(),
  findBy: jest.fn(),
};

const predefinedCategories = [
  { id: 1, name: 'outdoor', events: [] },
  { id: 2, name: 'indoor', events: [] },
  { id: 3, name: 'music', events: [] },
];

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        ...mockProviders.filter(
          (provider) => provider.provide !== CategoryService,
        ),
        {
          provide: getRepositoryToken(CategoryDB),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get(getRepositoryToken(CategoryDB));
  });

  describe('onModuleInit', () => {
    it('should initialize predefined categories if not already existing', async () => {
      mockCategoryRepository.findOneBy.mockImplementation((category) => {
        if (category.name === 'outdoor') return undefined;
        if (category.name === 'indoor') return undefined;
        if (category.name === 'music') return undefined;
        return predefinedCategories.find((c) => c.name === category.name);
      });

      const saveSpy = jest
        .spyOn(categoryRepository, 'save')
        .mockResolvedValueOnce(undefined);

      await service.onModuleInit();

      expect(saveSpy).toHaveBeenCalledTimes(12);
    });
  });

  describe('getCategories', () => {
    it('should return categories when found', async () => {
      const mockCategories = [{ id: 1, name: 'outdoor' }];
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const categories = await service.getCategories();

      expect(categories).toEqual(mockCategories);
    });

    it('should throw NotFoundException if no categories are found', async () => {
      mockCategoryRepository.find.mockResolvedValue([]);

      await expect(service.getCategories()).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCategoriesByIds', () => {
    it('should return categories for given IDs', async () => {
      const mockCategories = [
        { id: 1, name: 'outdoor' },
        { id: 2, name: 'indoor' },
      ];
      mockCategoryRepository.findBy.mockResolvedValue(mockCategories);

      const categories = await service.getCategoriesByIds([1, 2]);

      expect(categories).toEqual(mockCategories);
    });

    it('should throw NotFoundException if no categories are found with the given IDs', async () => {
      mockCategoryRepository.findBy.mockResolvedValue([]);

      await expect(service.getCategoriesByIds([99])).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

export const mockCategoryService = {
  findById: jest.fn().mockResolvedValue(mockCategoryRepository[1]),
  getCategoriesByIds: jest.fn().mockResolvedValue(mockCategoryRepository),
};

import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { UtilsService } from '../utils/utils.service';
import { BadRequestException } from '@nestjs/common';
import { GetCategoryDTO } from './DTO/GetCategoryDTO';

describe('CategoryController', () => {
  let controller: CategoryController;

  const mockCategoryService = {
    getCategories: jest.fn(),
  };

  const mockUtilsService = {
    transformCategoryDBtoGetCategoryDTO: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: UtilsService, useValue: mockUtilsService },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllCategories', () => {
    it('should return an array of GetCategoryDTO', async () => {
      const mockCategories = [
        { id: 1, name: 'Tech' },
        { id: 2, name: 'Sports' },
      ];

      const transformedCategoryDTO: GetCategoryDTO[] = [
        { id: 1, name: 'Tech' },
        { id: 2, name: 'Sports' },
      ];

      mockCategoryService.getCategories.mockResolvedValue(mockCategories);

      mockUtilsService.transformCategoryDBtoGetCategoryDTO
        .mockResolvedValueOnce(transformedCategoryDTO[0])
        .mockResolvedValueOnce(transformedCategoryDTO[1]);

      const result = await controller.getAllCategories();

      // Assertions
      expect(mockCategoryService.getCategories).toHaveBeenCalled();
      expect(mockUtilsService.transformCategoryDBtoGetCategoryDTO).toHaveBeenCalledTimes(mockCategories.length);
      expect(result).toEqual(transformedCategoryDTO);
    });

    it('should throw BadRequestException if service fails', async () => {
      // Setup mock to throw an error
      mockCategoryService.getCategories.mockRejectedValue(new Error('Service failed'));

      // Call the controller method and expect it to throw
      await expect(controller.getAllCategories()).rejects.toThrow(BadRequestException);
    });
  });
});
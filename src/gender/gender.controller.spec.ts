import { Test, TestingModule } from '@nestjs/testing';
import { GenderController } from './gender.controller';
import { GenderService } from './gender.service';
import { UtilsService } from '../utils/utils.service';
import { BadRequestException } from '@nestjs/common';
import { GetGenderDTO } from './DTO/GetGenderDTO';

describe('GenderController', () => {
  let controller: GenderController;

  const mockGenderService = {
    getGenders: jest.fn(),
  };

  const mockUtilsService = {
    transformGenderDBtoGetGenderDTO: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenderController],
      providers: [
        { provide: GenderService, useValue: mockGenderService },
        { provide: UtilsService, useValue: mockUtilsService },
      ],
    }).compile();

    controller = module.get<GenderController>(GenderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllCategories', () => {
    it('should return an array of GetGenderDTO', async () => {
      const mockGenders = [
        { id: 1, gender: 1 },
        { id: 2, gender: 2 },
      ];

      const transformedGenderDTO: GetGenderDTO[] = [
        { id: 1, gender: 1 },
        { id: 2, gender: 2 },
      ];

      mockGenderService.getGenders.mockResolvedValue(mockGenders);
      mockUtilsService.transformGenderDBtoGetGenderDTO
        .mockResolvedValueOnce(transformedGenderDTO[0])
        .mockResolvedValueOnce(transformedGenderDTO[1]);

      const result = await controller.getAllCategories();

      expect(mockGenderService.getGenders).toHaveBeenCalled();
      expect(mockUtilsService.transformGenderDBtoGetGenderDTO).toHaveBeenCalledTimes(mockGenders.length);
      expect(result).toEqual(transformedGenderDTO);
    });

    it('should throw BadRequestException if service fails', async () => {
      mockGenderService.getGenders.mockRejectedValue(new Error('Service failed'));

      await expect(controller.getAllCategories()).rejects.toThrow(BadRequestException);
    });
  });
});

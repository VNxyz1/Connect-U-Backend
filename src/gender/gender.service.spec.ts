import { GenderService } from './gender.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GenderDB } from '../database/GenderDB';
import { NotFoundException } from '@nestjs/common';
import { GenderEnum } from '../database/enums/GenderEnum';

const mockGenderRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findBy: jest.fn(),
};

const predefinedGenders = [
  { gender: GenderEnum.Female },
  { gender: GenderEnum.Male},
  { gender: GenderEnum.Diverse },
];

describe('GenderService', () => {
  let service: GenderService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenderService,
        {
          provide: getRepositoryToken(GenderDB),
          useValue: mockGenderRepository,  // Mock repository here
        },
      ],
    }).compile();

    service = module.get<GenderService>(GenderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize predefined genders if not already existing', async () => {
      jest.spyOn(mockGenderRepository, 'findOne')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const saveSpy = jest.spyOn(mockGenderRepository, 'save').mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(saveSpy).toHaveBeenCalledTimes(predefinedGenders.length);
    });
  });

  describe('getGenders', () => {
    it('should return an array of genders if found', async () => {
      const mockGenders = [{ gender: 1 }, { gender: 2 }];
      jest.spyOn(mockGenderRepository, 'find').mockResolvedValue(mockGenders as GenderDB[]);

      const genders = await service.getGenders();

      expect(genders).toEqual(mockGenders);
    });

    it('should throw NotFoundException if no genders are found', async () => {
      jest.spyOn(mockGenderRepository, 'find').mockResolvedValue([]);

      await expect(service.getGenders()).rejects.toThrow(NotFoundException);
    });
  });

  describe('getGendersByIds', () => {
    it('should return genders for given IDs', async () => {
      const mockGenders = [{ gender: 1 }, { gender: 2 }];
      jest.spyOn(mockGenderRepository, 'findBy').mockResolvedValue(mockGenders as GenderDB[]);

      const genders = await service.getGendersByIds([1, 2]);

      expect(genders).toEqual(mockGenders);
    });

    it('should throw NotFoundException if no genders are found with the given IDs', async () => {
      jest.spyOn(mockGenderRepository, 'findBy').mockResolvedValue([]);

      await expect(service.getGendersByIds([99])).rejects.toThrow(NotFoundException);
    });
  });
});

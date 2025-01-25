import { Test, TestingModule } from '@nestjs/testing';
import { CityController } from './city.controller';
import { CityService } from './city.service';
import { NotFoundException } from '@nestjs/common';
import * as request from 'supertest';

describe('CityController', () => {
  let app;

  const mockCityService = {
    searchLocalities: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CityController],
      providers: [
        {
          provide: CityService,
          useValue: mockCityService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /city/localities', () => {
    it('should return a list of localities when valid parameters are provided', async () => {
      const mockData = [
        { postalCode: '12345', name: 'Test City 1' },
        { postalCode: '67890', name: 'Test City 2' },
      ];

      mockCityService.searchLocalities.mockResolvedValue(mockData);

      const response = await request(app.getHttpServer())
        .get('/city/localities')
        .query({
          postalCode: '12345',
          name: 'Test City',
          page: 1,
          pageSize: 50,
        })
        .expect(200);

      expect(response.body).toEqual(mockData);
      expect(mockCityService.searchLocalities).toHaveBeenCalledWith(
        '12345',
        'Test City',
        '1',
        '50',
      );
    });

    it('should return an empty list when no cities are found', async () => {
      mockCityService.searchLocalities.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/city/localities')
        .query({
          postalCode: '99999',
          name: 'Nonexistent City',
          page: 1,
          pageSize: 50,
        })
        .expect(200);

      expect(response.body).toEqual([]);
      expect(mockCityService.searchLocalities).toHaveBeenCalledWith(
        '99999',
        'Nonexistent City',
        '1',
        '50',
      );
    });

    it('should throw NotFoundException if the service throws an error', async () => {
      mockCityService.searchLocalities.mockRejectedValue(
        new NotFoundException('No cities found'),
      );

      const response = await request(app.getHttpServer())
        .get('/city/localities')
        .query({
          postalCode: '12345',
          name: 'Invalid City',
          page: 1,
          pageSize: 50,
        })
        .expect(404);

      expect(response.body.message).toEqual('No cities found');
    });
  });
});

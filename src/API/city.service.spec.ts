import { Test, TestingModule } from '@nestjs/testing';
import { CityService } from './city.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CityService', () => {
  let service: CityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CityService],
    }).compile();

    service = module.get<CityService>(CityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchLocalities', () => {
    it('should return a list of localities when API returns data', async () => {
      const mockData = [
        { postalCode: '12345', name: 'Test City 1' },
        { postalCode: '67890', name: 'Test City 2' },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await service.searchLocalities('12345', 'Test City');

      expect(result).toEqual([
        { postalCode: '12345', name: 'Test City 1' },
        { postalCode: '67890', name: 'Test City 2' },
      ]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://openplzapi.org/de/Localities',
        {
          params: {
            page: 1,
            pageSize: 50,
            postalCode: '12345',
            name: 'Test City',
          },
          headers: { accept: 'text/json' },
        },
      );
    });

    it('should return a list of localities when only postalCode is provided', async () => {
      const mockData = [
        { postalCode: '12345', name: 'Test City 1' },
        { postalCode: '67890', name: 'Test City 2' },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await service.searchLocalities('12345');

      expect(result).toEqual([
        { postalCode: '12345', name: 'Test City 1' },
        { postalCode: '67890', name: 'Test City 2' },
      ]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://openplzapi.org/de/Localities',
        {
          params: { page: 1, pageSize: 50, postalCode: '12345' },
          headers: { accept: 'text/json' },
        },
      );
    });

    it('should return a list of localities when only name is provided', async () => {
      const mockData = [
        { postalCode: '12345', name: 'Test City 1' },
        { postalCode: '67890', name: 'Test City 2' },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await service.searchLocalities(undefined, 'Test City');

      expect(result).toEqual([
        { postalCode: '12345', name: 'Test City 1' },
        { postalCode: '67890', name: 'Test City 2' },
      ]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://openplzapi.org/de/Localities',
        {
          params: { page: 1, pageSize: 50, name: 'Test City' },
          headers: { accept: 'text/json' },
        },
      );
    });
  });
});

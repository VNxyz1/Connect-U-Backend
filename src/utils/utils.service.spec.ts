import { UtilsService } from './utils.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UtilsService],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAge', () => {
    it('should be accepted', () => {
      const validDate = new Date('2002-02-18');
      const ret = service.validateUserAge(validDate, 18);
      expect(ret).toEqual(true);
    });

    it('should be accepted closely', () => {
      const validDate = new Date();
      validDate.setFullYear(validDate.getFullYear() - 18);
      validDate.setMinutes(validDate.getMinutes() - 1);

      const ret = service.validateUserAge(validDate, 18);
      expect(ret).toEqual(true);
    });

    it('should be denied', () => {
      const unvalid = new Date();
      unvalid.setFullYear(unvalid.getFullYear() - 18);

      const ret = service.validateUserAge(unvalid, 21);
      expect(ret).toEqual(false);
    });

    it('should be denied closely', () => {
      const unvalid = new Date();
      unvalid.setFullYear(unvalid.getFullYear() - 18);
      unvalid.setHours(unvalid.getHours() + 24);

      const ret = service.validateUserAge(unvalid, 18);
      expect(ret).toEqual(false);
    });
  });
});

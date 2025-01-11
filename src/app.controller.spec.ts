import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventService } from './event/event.service';
import { mockEventService } from './event/event.service.spec';
import { OkDTO } from './serverDTO/OkDTO';
import { ServiceUnavailableException } from '@nestjs/common';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toEqual({ message: 'Hello World!' });
    });
  });

  describe('health', () => {
    it('should return "healthy"', () => {
      expect(appController.healthCheck()).toEqual(new OkDTO(true, 'healthy'));
    });
  });

  describe('ready', () => {
    it('should return "ready"', () => {
      expect(appController.readinessCheck()).resolves.toEqual(
        new OkDTO(true, 'ready'),
      );
    });

    it('should return "not ready"', () => {
      jest
        .spyOn(mockEventService, 'getAllActiveEventsByPopularity')
        .mockResolvedValue(null);
      expect(appController.readinessCheck()).rejects.toEqual(
        new ServiceUnavailableException('Not ready'),
      );
    });
  });
});

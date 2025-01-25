import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventDB } from '../database/EventDB';
import { Repository } from 'typeorm';
import { StatusEnum } from '../database/enums/StatusEnum';
import { RequestService } from '../request/request.service';
import * as schedule from 'node-schedule';

jest.mock('node-schedule');

describe('SchedulerService', () => {
  let schedulerService: SchedulerService;
  let eventRepository: Repository<EventDB>;
  let requestService: RequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: getRepositoryToken(EventDB),
          useClass: Repository,
        },
        {
          provide: RequestService,
          useValue: {
            deleteRequestsByEventId: jest.fn(),
          },
        },
      ],
    }).compile();

    schedulerService = module.get<SchedulerService>(SchedulerService);
    eventRepository = module.get<Repository<EventDB>>(
      getRepositoryToken(EventDB),
    );
    requestService = module.get<RequestService>(RequestService);
  });

  describe('scheduleEventStatusUpdate', () => {
    it('should schedule the event status to live', async () => {
      const event = {
        id: '1',
        dateAndTime: new Date(Date.now() + 10000),
        status: StatusEnum.upcoming,
      } as unknown as EventDB;
      jest.spyOn(eventRepository, 'findOne').mockResolvedValue(event);
      jest.spyOn(eventRepository, 'save').mockResolvedValue(event);

      await schedulerService.scheduleEventStatusUpdate(event);

      expect(schedule.scheduleJob).toHaveBeenCalled();
    });

    it('should not schedule if the event time is in the past', async () => {
      const event = {
        id: '1',
        dateAndTime: new Date(Date.now() - 10000),
        status: StatusEnum.upcoming,
      } as unknown as EventDB;
      jest.spyOn(eventRepository, 'findOne').mockResolvedValue(event);
      jest.spyOn(eventRepository, 'save').mockResolvedValue(event);

      await schedulerService.scheduleEventStatusUpdate(event);
    });
  });

  describe('scheduleFinishedStatusUpdate', () => {
    it('should schedule the finished status update', async () => {
      const event = {
        id: '1',
        dateAndTime: new Date(Date.now() + 10000),
        status: StatusEnum.live,
      } as unknown as EventDB;
      jest.spyOn(eventRepository, 'save').mockResolvedValue(event);
      jest
        .spyOn(requestService, 'deleteRequestsByEventId')
        .mockResolvedValue(undefined);

      await schedulerService.scheduleFinishedStatusUpdate(event);

      expect(schedule.scheduleJob).toHaveBeenCalled();
    });

    it('should not schedule if the finished time is in the past', async () => {
      const event = {
        id: '1',
        dateAndTime: new Date(Date.now() - 10000),
        status: StatusEnum.live,
      } as unknown as EventDB;
      jest.spyOn(eventRepository, 'save').mockResolvedValue(event);

      await schedulerService.scheduleFinishedStatusUpdate(event);
    });
  });

  describe('rescheduleAllEvents', () => {
    it('should reschedule events based on their status', async () => {
      const events = [
        {
          id: '1',
          dateAndTime: new Date(Date.now() + 10000),
          status: StatusEnum.upcoming,
        } as unknown as EventDB,
        {
          id: '2',
          dateAndTime: new Date(Date.now() - 10000),
          status: StatusEnum.live,
        } as unknown as EventDB,
      ];
      jest.spyOn(eventRepository, 'find').mockResolvedValue(events);
      jest.spyOn(eventRepository, 'save').mockResolvedValue(undefined);

      await schedulerService.rescheduleAllEvents();
    });

    it('should update event status to finished and delete requests for finished events', async () => {
      const event = {
        id: '2',
        dateAndTime: new Date(Date.now() - 10000),
        status: StatusEnum.live,
      } as unknown as EventDB;
      jest.spyOn(eventRepository, 'find').mockResolvedValue([event]);
      jest.spyOn(eventRepository, 'save').mockResolvedValue(event);
      jest
        .spyOn(requestService, 'deleteRequestsByEventId')
        .mockResolvedValue(undefined);

      await schedulerService.rescheduleAllEvents();
    });
  });
});

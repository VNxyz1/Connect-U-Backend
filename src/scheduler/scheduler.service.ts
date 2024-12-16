import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as schedule from 'node-schedule';
import { EventDB } from '../database/EventDB';
import { StatusEnum } from '../database/enums/StatusEnum';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestService } from '../request/request.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
    private readonly requestService: RequestService,
  ) {}

  async onModuleInit() {
    await this.rescheduleAllEvents();
  }

  /**
   * Schedules an event status update at the specified time.
   * @param event The event to schedule.
   */
  async scheduleEventStatusUpdate(event: EventDB): Promise<void> {
    const eventTime = new Date(event.dateAndTime);

    if (eventTime > new Date()) {
      schedule.scheduleJob(eventTime, async () => {
        event.status = StatusEnum.live;
        await this.eventRepository.save(event);

        this.logger.log(`Event ${event.id} status updated to live.`);

        await this.scheduleFinishedStatusUpdate(event);
      });
    }
  }

  /**
   * Schedules the 'finished' status update 24 hours after the event becomes live.
   * @param event The event to schedule the 'finished' status update for.
   */
  async scheduleFinishedStatusUpdate(event: EventDB): Promise<void> {
    const finishedTime = new Date(event.dateAndTime);
    finishedTime.setHours(finishedTime.getHours() + 24);

    if (finishedTime > new Date()) {
      schedule.scheduleJob(finishedTime, async () => {
        event.status = StatusEnum.finished;
        await this.eventRepository.save(event);

        this.logger.log(`Event ${event.id} status updated to finished.`);

        await this.deleteEventRequests(event.id);
      });
    }
  }

  /**
   * Deletes all requests associated with the event when it is finished.
   * @param eventId The ID of the event to delete requests for.
   */
  private async deleteEventRequests(eventId: string): Promise<void> {
    await this.requestService.deleteRequestsByEventId(eventId);
  }

  async rescheduleAllEvents(): Promise<void> {
    const events = await this.eventRepository.find({
      where: [{ status: StatusEnum.upcoming }, { status: StatusEnum.live }],
    });

    events.forEach((event) => {
      if (event.status === StatusEnum.upcoming) {
        this.scheduleEventStatusUpdate(event);
      } else if (event.status === StatusEnum.live) {
        this.scheduleFinishedStatusUpdate(event);
      }
    });
  }
}

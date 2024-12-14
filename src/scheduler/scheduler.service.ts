import { Injectable, Logger } from '@nestjs/common';
import * as schedule from 'node-schedule';
import { EventDB } from '../database/EventDB';
import { StatusEnum } from '../database/enums/StatusEnum';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
  ) {}

  /**
   * Schedules an event status update at the specified time.
   * @param event The event to schedule.
   */
  async scheduleEventStatusUpdate(event: EventDB): Promise<void> {
    const eventTime = new Date(event.dateAndTime);

    // Ensure the event time is in the future
    if (eventTime > new Date()) {
      schedule.scheduleJob(eventTime, async () => {
        this.logger.log(`Updating status for event: ${event.id}`);

        // Update event status to 'live'
        event.status = StatusEnum.live;
        await this.eventRepository.save(event);

        this.logger.log(`Event ${event.id} status updated to live.`);
      });

      this.logger.log(`Scheduled status update for event ${event.id} at ${eventTime}`);
    } else {
      this.logger.warn(`Event ${event.id} dateAndTime is in the past. No schedule created.`);
    }
  }

  /**
   * Reschedules all future events after a server restart.
   */
  async rescheduleAllEvents(): Promise<void> {
    const events = await this.eventRepository.find({
      where: { status: StatusEnum.upcoming },
    });

    events.forEach((event) => this.scheduleEventStatusUpdate(event));
  }
}

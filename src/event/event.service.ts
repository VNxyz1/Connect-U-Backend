import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { EventDB } from '../database/EventDB';
import { CreateEventDTO } from './DTO/CreateEventDTO';
import { UserDB } from '../database/UserDB';
import { CategoryDB } from '../database/CategoryDB';
import { GenderDB } from '../database/GenderDB';
import { NotFoundException } from '@nestjs/common';

export class EventService {
  constructor(
    @InjectRepository(EventDB)
    private eventRepository: Repository<EventDB>,
  ) {}

  /**
   * Creates a new event in the database.
   *
   * @param user - the user that creates the event
   * @param categories - categories of the event
   * @param preferredGenders - preferred genders of the event
   * @param {CreateEventDTO} body - Data transfer object containing event information.
   * @returns {Promise<EventDB>} - The newly created event.
   */
  async createEvent(
    user: UserDB,
    categories: CategoryDB[],
    preferredGenders: GenderDB[],
    body: CreateEventDTO,
  ): Promise<EventDB> {
    const newEvent: EventDB = this.eventRepository.create();
    newEvent.host = user;
    newEvent.dateAndTime = body.dateAndTime;
    newEvent.title = body.title;
    newEvent.type = body.type;
    newEvent.isOnline = body.isOnline;
    newEvent.showAddress = body.showAddress;
    newEvent.streetNumber = body.streetNumber;
    newEvent.street = body.street;
    newEvent.zipCode = body.zipCode;
    newEvent.city = body.city;
    newEvent.participantsNumber = body.participantsNumber;
    newEvent.startAge = body.startAge;
    newEvent.endAge = body.endAge;
    newEvent.categories = categories;
    newEvent.preferredGenders = preferredGenders;
    return await this.eventRepository.save(newEvent);
  }

  /**
   * Gets all events from the database that were not created by the user logged in.
   *
   * @param user - the user currently logged in
   * @returns {Promise<EventDB[]>} - The events.
   * @throws {NotFoundException} - If there are no events found.
   */
  async getAllEvents(user: UserDB | null): Promise<EventDB[]> {
    const events = await this.eventRepository.find({
      relations: ['host', 'categories', 'participants'],
      where: user ? { host: { id: Not(user.id) } } : {},
    });

    if (!events || events.length === 0) {
      throw new NotFoundException('Events not found');
    }

    return events;
  }
}

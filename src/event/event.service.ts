import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventDB } from '../database/EventDB';
import { CreateEventDTO } from './DTO/CreateEventDTO';
import { UserDB } from '../database/UserDB';
import { CategoryDB } from '../database/CategoryDB';
import { GenderDB } from '../database/GenderDB';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatusEnum } from '../database/enums/StatusEnum';
import { ListEntryDB } from '../database/ListEntryDB';
import { SurveyEntryDB } from '../database/SurveyEntryDB';
import { TagDB } from '../database/TagDB';
import { SchedulerService } from '../scheduler/scheduler.service';
import { FilterDTO } from './DTO/FilterDTO';
import { EventtypeEnum } from '../database/enums/EventtypeEnum';

export class EventService {
  constructor(
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
    @InjectRepository(ListEntryDB)
    private readonly listEntryRepository: Repository<ListEntryDB>,
    @InjectRepository(SurveyEntryDB)
    private readonly surveyEntryRepository: Repository<SurveyEntryDB>,
    private readonly schedulerService: SchedulerService,
  ) {}

  /**
   * Creates a new event in the database.
   *
   * @param user - the user that creates the event
   * @param eventTags -tags for the event
   * @param categories - categories of the event
   * @param preferredGenders - preferred genders of the event
   * @param {CreateEventDTO} body - Data transfer object containing event information.
   * @returns {Promise<EventDB>} - The newly created event.
   */
  async createEvent(
    user: UserDB,
    eventTags: TagDB[] | null,
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
    newEvent.description = body.description;
    newEvent.categories = categories;
    newEvent.preferredGenders = preferredGenders;
    newEvent.tags = eventTags;
    const savedEvent = await this.eventRepository.save(newEvent);

    await this.schedulerService.scheduleEventStatusUpdate(savedEvent);

    return savedEvent;
  }

  /**
   * Finds a specific event by its ID
   * @param eventId - The ID of the event.
   *
   * @returns The event.
   *
   * @throws NotFoundException If the event with the given `eventId` does not exist.
   */
  async getEventById(eventId: string): Promise<EventDB> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: [
        'categories',
        'participants',
        'preferredGenders',
        'host',
        'tags',
      ],
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    return event;
  }

  /**
   * Gets all events from the database with optional filters.
   *
   * @param {FilterDTO} filters - The filters to apply.
   * @returns {Promise<EventDB[]>} - The filtered events.
   * @throws {NotFoundException} - If there are no events found.
   */
  async getAllEvents(filters: FilterDTO): Promise<EventDB[]> {
    const {
      title,
      minAge,
      maxAge,
      genders,
      isPublic,
      isHalfPublic,
      isOnline,
      isInPlace,
    } = filters;

    const queryBuilder = this.eventRepository.createQueryBuilder('event');

    queryBuilder.leftJoinAndSelect('event.categories', 'categories');
    queryBuilder.leftJoinAndSelect('event.participants', 'participants');
    queryBuilder.leftJoinAndSelect('event.tags', 'tags');

    if (title) {
      queryBuilder.andWhere('event.title LIKE :title', { title: `%${title}%` });
    }

    if (minAge) {
      queryBuilder.andWhere('event.startAge >= :minAge', { minAge });
    }

    if (maxAge) {
      queryBuilder.andWhere('event.endAge <= :maxAge', { maxAge });
    }

    if (genders && genders.length > 0) {
      queryBuilder.andWhere('gender.name IN (:...genders)', { genders });
    }

    if (isPublic == false) {
      queryBuilder.andWhere('event.type != :eventType', { eventType: EventtypeEnum.public });
    }

    if (isHalfPublic == false) {
      queryBuilder.andWhere('event.type != :eventType', { eventType: EventtypeEnum.halfPrivate });
    }

    if (isOnline === false) {
      queryBuilder.andWhere('event.isOnline = :isOnline', { isOnline: false });
    }

    if (isInPlace === false) {
      queryBuilder.andWhere('event.isOnline = :isOnline', { isOnline: true });
    }

    queryBuilder.orderBy('event.timestamp', 'DESC');

    const events = await queryBuilder.getMany();

    if (!events || events.length === 0) {
      throw new NotFoundException('Events not found');
    }

    return events;
  }

  /**
   * Gets all events where the user is a participant.
   *
   * @param userId - the user who is a participant
   * @returns {Promise<EventDB[]>} - The events where the user is a participant.
   */
  async getParticipatingEvents(userId: string): Promise<EventDB[]> {
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.participants', 'participant')
      .leftJoinAndSelect('event.categories', 'category')
      .leftJoinAndSelect('event.tags', 'tag')
      .leftJoinAndSelect('event.host', 'host')
      .where('participant.id = :userId', { userId: userId })
      .orderBy('event.dateAndTime', 'ASC')
      .getMany();

    return events.length > 0 ? events : [];
  }

  /**
   * Gets the events the user is hosting from the database.
   *
   * @param userId - the user that is logged in
   * @returns {Promise<EventDB[]>} - The events.
   */
  async getHostingEvents(userId: string): Promise<EventDB[]> {
    const events = await this.eventRepository.find({
      where: { host: { id: userId } },
      relations: ['host', 'categories', 'participants', 'tags'],
      order: {
        dateAndTime: 'ASC',
      },
    });

    return events.length > 0 ? events : [];
  }

  /**
   * Gets upcoming events the user is hosting or participating from the database.
   *
   * @param userId - the user that is logged in
   * @returns {Promise<EventDB[]>} - The events.
   * @throws {NotFoundException} - If there are no events found.
   */
  async getUpcomingAndLiveEvents(userId: string): Promise<EventDB[]> {
    const events = await this.eventRepository.find({
      where: [
        {
          host: { id: userId },
          status: In([StatusEnum.upcoming, StatusEnum.live]),
        },
        {
          participants: { id: userId },
          status: In([StatusEnum.upcoming, StatusEnum.live]),
        },
      ],
      relations: {
        host: true,
        categories: true,
        participants: true,
      },
      order: {
        dateAndTime: 'ASC',
      },
    });

    if (!events || events.length === 0) {
      throw new NotFoundException('No events found for this user');
    }

    return events;
  }

  /**
   * Adds a user as a participant to a specific event.
   * @param user - The user to be added to the event.
   * @param eventId - The ID of the event to which the user is being added.
   *
   * @returns The updated event after the user has been added as a participant.
   *
   * @throws NotFoundException If the event with the given `eventId` does not exist.
   * @throws BadRequestException If the user is the host of the event or is already a participant in the event.
   */
  async addUserToEvent(user: UserDB, eventId: string): Promise<EventDB> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['participants', 'host'],
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    const isHost = event.host.id == user.id;
    if (isHost) {
      throw new BadRequestException('user is the host of this event');
    }
    const isAlreadyParticipant = event.participants.some(
      (participant) => participant.id === user.id,
    );
    if (isAlreadyParticipant) {
      throw new BadRequestException(
        'User is already a participant in this event',
      );
    }

    if (event.participants.length >= event.participantsNumber) {
      throw new BadRequestException(
        'The event has reached the maximum number of participants',
      );
    }

    event.participants.push(user);

    return await this.eventRepository.save(event);
  }

  /**
   * Removes a user from the participants list of a specific event.
   * @param user - The user to be removed from the event.
   * @param eventId - The ID of the event from which the user is being removed.
   *
   * @returns The updated event after the user has been removed from the participants list.
   *
   * @throws BadRequestException If the user is not a participant in the event.
   */
  async removeUserFromEvent(user: UserDB, eventId: string): Promise<EventDB> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: [
        'participants',
        'host',
        'lists.listEntries',
        'lists.listEntries.user',
        'surveys.surveyEntries',
        'surveys.surveyEntries.users',
      ],
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    const isParticipant = event.participants.some(
      (participant) => participant.id === user.id,
    );

    if (!isParticipant) {
      throw new BadRequestException('User is not a participant in this event');
    }

    event.participants = event.participants.filter(
      (participant) => participant.id !== user.id,
    );

    for (const list of event.lists) {
      for (const listEntry of list.listEntries) {
        if (listEntry.user) {
          if (listEntry.user.id === user.id) {
            listEntry.user = null;
            await this.listEntryRepository.save(listEntry);
          }
        }
      }
    }

    for (const survey of event.surveys) {
      for (const surveyEntry of survey.surveyEntries) {
        if (surveyEntry.users) {
          surveyEntry.users = surveyEntry.users.filter(
            (participant) => participant.id !== user.id,
          );
          await this.surveyEntryRepository.save(surveyEntry);
        }
      }
    }

    return await this.eventRepository.save(event);
  }
}

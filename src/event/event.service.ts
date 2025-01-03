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

export class EventService {
  constructor(
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
    @InjectRepository(ListEntryDB)
    private readonly listEntryRepository: Repository<ListEntryDB>,
    @InjectRepository(SurveyEntryDB)
    private readonly surveyEntryRepository: Repository<SurveyEntryDB>,
    @InjectRepository(UserDB)
    private readonly userRepository: Repository<UserDB>,
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
   * Gets all events from the database.
   *
   * @returns {Promise<EventDB[]>} - The events.
   * @throws {NotFoundException} - If there are no events found.
   */
  async getAllEvents(): Promise<EventDB[]> {
    const events = await this.eventRepository.find({
      relations: ['categories', 'participants', 'tags'],
      order: {
        timestamp: 'DESC',
      },
    });

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

  async fyPageAlgo(userId: string): Promise<EventDB[]> {
    // Hole Hosting- und Teilnahme-Events mit Kategorien und Tags in einer Abfrage
    const hostingEvents = await this.getHostingEvents(userId);
    const participatingEvents = await this.getParticipatingEvents(userId);

    const hostAndParticipant = [...hostingEvents, ...participatingEvents];

    // Frequenzkarten erstellen
    const [hpCategories, hpTags, hpCities] =
      this.calculateFrequencyMaps(hostAndParticipant);

    // Datenbankabfrage: Nur relevante Events holen und direkt sortieren
    const res = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.categories', 'categories')
      .leftJoinAndSelect('event.tags', 'tags')
      .where('categories.id IN (:...categoryIds)', {
        categoryIds: Array.from(hpCategories.keys()),
      })
      .orWhere('tags.id IN (:...tagIds)', { tagIds: Array.from(hpTags.keys()) })
      .getMany();

    // Relevanzberechnung parallelisieren
    const sortedWithRelevance = res
      .map((event) => ({
        event,
        relevance: this.calculateRelevance(
          event,
          hpCategories,
          hpTags,
          hpCities,
        ),
      }))
      .sort((a, b) => b.relevance - a.relevance);

    return sortedWithRelevance.map((item) => item.event);
  }

  private calculateFrequencyMaps(
    events: EventDB[],
  ): [Map<number, number>, Map<number, number>, Map<string, number>] {
    const categoryFrequencyMap: Map<number, number> = new Map();
    const tagFrequencyMap: Map<number, number> = new Map();
    const cityFrequencyMap: Map<string, number> = new Map();

    for (const event of events) {
      for (const category of event.categories) {
        categoryFrequencyMap.set(
          category.id,
          (categoryFrequencyMap.get(category.id) || 0) + 1,
        );
      }
      for (const tag of event.tags) {
        tagFrequencyMap.set(tag.id, (tagFrequencyMap.get(tag.id) || 0) + 1);
      }
      cityFrequencyMap.set(
        event.city,
        (cityFrequencyMap.get(event.city) || 0) + 1,
      );
    }

    return [categoryFrequencyMap, tagFrequencyMap, cityFrequencyMap];
  }

  private calculateRelevance(
    event: EventDB,
    hpCategories: Map<number, number>,
    hpTags: Map<number, number>,
    hpCities: Map<string, number>,
  ): number {
    // Berechnung der maximal möglichen Relevanz für Normalisierung
    const maxCategoryRelevance =
      Array.from(hpCategories.values()).reduce(
        (sum, value) => sum + value,
        0,
      ) || 1;
    const maxTagRelevance =
      Array.from(hpTags.values()).reduce((sum, value) => sum + value, 0) || 1;
    const maxCityRelevance =
      Array.from(hpCities.values()).reduce((sum, value) => sum + value, 0) || 1;

    // Relevanzwerte für das Event berechnen
    const categoryRelevance =
      event.categories.reduce(
        (sum, category) => sum + (hpCategories.get(category.id) || 0),
        0,
      ) / maxCategoryRelevance;

    const tagRelevance =
      event.tags.reduce((sum, tag) => sum + (hpTags.get(tag.id) || 0), 0) /
      maxTagRelevance;

    const cityRelevance = (hpCities.get(event.city) || 0) / maxCityRelevance;

    // Prozentuale Gewichtung der Faktoren
    const categoryWeight = 0.32;
    const tagWeight = 0.08;
    const cityWeight = 0.4;

    // Berechnung der Gesamtrelevanz
    const totalRelevance =
      categoryRelevance * categoryWeight * 100 +
      tagRelevance * tagWeight * 100 +
      cityRelevance * cityWeight * 100;

    return totalRelevance;
  }
}

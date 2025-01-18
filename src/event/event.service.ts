import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
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
import { FilterDTO, SortOrder } from './DTO/FilterDTO';
import ViewEventEnum from '../database/enums/ViewEventEnum';
import ViewedEventsDB from '../database/ViewedEventsDB';
import { EventtypeEnum } from '../database/enums/EventtypeEnum';
import { FriendService } from '../friend/friend.service';

export class EventService {
  constructor(
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
    @InjectRepository(ListEntryDB)
    private readonly listEntryRepository: Repository<ListEntryDB>,
    @InjectRepository(SurveyEntryDB)
    private readonly surveyEntryRepository: Repository<SurveyEntryDB>,
    @InjectRepository(ViewedEventsDB)
    private readonly veRepository: Repository<ViewedEventsDB>,
    private readonly schedulerService: SchedulerService,
    private readonly friendsService: FriendService,
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
    newEvent.picture = 'empty.png'
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
  async getAllActiveEventsByPopularity(
    page: number = 0,
    size: number = 12,
  ): Promise<EventDB[]> {
    const events = await this.eventRepository.find({
      where: {
        status: Not(In([StatusEnum.cancelled, StatusEnum.finished])),
        type: Not(EventtypeEnum.private),
      },
      relations: {
        categories: true,
        participants: true,
        tags: true,
        viewEvents: true,
      },
      order: {
        viewEvents: {
          viewed: 'DESC',
        },
      },
      skip: page * size,
      take: size,
    });

    if (!events) {
      throw new NotFoundException('Events not found');
    }

    return events;
  }

  /**
   * Gets all events from the database with optional filters.
   *
   * @param userId - ID of the current user
   * @param {FilterDTO} filters - The filters to apply.
   * @param page which page
   * @param size page size
   * @returns {Promise<EventDB[]>} - The filtered events.
   * @throws {NotFoundException} - If there are no events found.
   */
  async getFilteredEvents(
    userId: string,
    filters: FilterDTO,
    page: number = 0,
    size: number = 12,
  ): Promise<[EventDB[], number]> {
    const {
      title,
      minAge,
      maxAge,
      genders,
      isPublic,
      isHalfPublic,
      isOnline,
      isInPlace,
      sortOrder,
      categories,
      tags,
      dates,
      cities,
      filterFriends,
    } = filters;

    const queryBuilder = this.eventRepository.createQueryBuilder('event');

    queryBuilder.leftJoinAndSelect('event.categories', 'categories');
    queryBuilder.leftJoinAndSelect('event.participants', 'participants');
    queryBuilder.leftJoinAndSelect('event.tags', 'tags');

    queryBuilder.andWhere('event.status = :status', {
      status: StatusEnum.upcoming,
    });

    queryBuilder.andWhere('event.type != :eventType', { eventType: 3 });

    if (title) {
      queryBuilder.andWhere('event.title LIKE :title', { title: `%${title}%` });
    }

    if (filterFriends) {
      const friends = await this.friendsService.getFriends(userId);
      const friendsIds = friends.map((friend) => friend.id);
      queryBuilder
        .leftJoin('event.host', 'host')
        .andWhere(
          'participants.id IN (:...friendsIds) OR host.id IN (:...friendsIds)',
          {
            friendsIds: friendsIds,
          },
        );
    }

    if (dates?.length) {
      queryBuilder.andWhere('DATE(event.dateAndTime) IN (:...dates)', {
        dates: dates,
      });
    }

    if (cities?.length) {
      queryBuilder.andWhere('event.city IN (:...cities)', {
        cities,
      });
    }
    if (isOnline) {
      queryBuilder.andWhere('event.city IS NULL');
    }

    if (categories && categories.length > 0) {
      queryBuilder.andWhere('categories.id IN (:...categories)', {
        categories,
      });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('tags.title IN (:...tags)', { tags });
    }

    if (minAge) {
      queryBuilder.andWhere('event.startAge >= :minAge', { minAge });
    }

    if (maxAge) {
      queryBuilder.andWhere('event.endAge <= :maxAge', { maxAge });
    }

    if (genders.length !== 3) {
      queryBuilder
        .leftJoin('event.preferredGenders', 'preferredGender')
        .andWhere(
          'NOT EXISTS (SELECT 1 FROM EventPreferredGenders pg WHERE pg.eventDbId = event.id AND pg.genderDbId NOT IN (:...genders))',
          { genders },
        )
        .andWhere('preferredGender.id IS NOT NULL');
    }

    if (isPublic === false) {
      queryBuilder.andWhere('event.type != :eventType', {
        eventType: EventtypeEnum.public,
      });
    }

    if (isHalfPublic === false) {
      queryBuilder.andWhere('event.type != :eventType', {
        eventType: EventtypeEnum.halfPrivate,
      });
    }

    if (isOnline === false) {
      queryBuilder.andWhere('event.isOnline = :isOnline', { isOnline: false });
    }

    if (isInPlace === false) {
      queryBuilder.andWhere('event.isOnline = :isOnline', { isOnline: true });
    }

    if (sortOrder) {
      switch (sortOrder) {
        case SortOrder.NEWEST_FIRST:
          queryBuilder.orderBy('event.timestamp', 'DESC');
          break;
        case SortOrder.OLDEST_FIRST:
          queryBuilder.orderBy('event.timestamp', 'ASC');
          break;
        case SortOrder.UPCOMING_NEXT:
          queryBuilder.orderBy('event.dateAndTime', 'ASC');
          break;
        case SortOrder.UPCOMING_LAST:
          queryBuilder.orderBy('event.dateAndTime', 'DESC');
          break;
        case SortOrder.ALPHABETICAL_ASC:
          queryBuilder.orderBy('event.title', 'ASC');
          break;
        case SortOrder.ALPHABETICAL_DESC:
          queryBuilder.orderBy('event.title', 'DESC');
          break;
      }
    } else {
      queryBuilder.orderBy('event.dateAndTime', 'ASC');
    }

    const [events, total] = await queryBuilder
      .skip(page * size)
      .take(size)
      .getManyAndCount();

    if (!events.length) {
      throw new NotFoundException('Events not found');
    }

    return [events, total];
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

  /**
   * Updates a user's profile picture.
   *
   * @param {string} id - The unique ID of the event to update.
   * @param picture - new picture path
   * @returns {Promise<UserDB>} - The updated event.
   */
  async updatePicture(id: string, picture: string): Promise<EventDB> {
    const event = await this.getEventById(id);

    event.picture = picture;

    return await this.eventRepository.save(event);
  }

  async getFriendsEvents(userId: string): Promise<EventDB[]> {
    const friends = await this.friendsService.getFriends(userId);
    const friendsIds = friends.map((friend) => friend.id);
    return await this.eventRepository.find({
      where: [
        {
          host: { id: In(friendsIds) },
          status: Not(In([StatusEnum.finished, StatusEnum.cancelled])),
          type: Not(EventtypeEnum.private),
        },
        {
          participants: { id: In(friendsIds) },
          status: Not(In([StatusEnum.finished, StatusEnum.cancelled])),
          type: Not(EventtypeEnum.private),
        },
      ],
      select: {
        participantsNumber: true,
        participants: true,
        id: true,
        isOnline: true,
        city: true,
        categories: true,
        dateAndTime: true,
        title: true,
        picture: true,
        status: true,
        type: true,
        tags: true,
      },
      relations: { categories: true, tags: true },
    });
  }

  /**
   * Fetches and sorts events based on user preferences, participation, and click frequency.
   * @param {string} userId - The ID of the user for whom the events are fetched and ranked.
   * @returns {Promise<EventDB[]>} - A sorted list of events based on relevance scores.
   */
  async fyPageAlgo(userId: string): Promise<EventDB[]> {
    // Parallelize database calls for hosting, participating, clicked, and active events
    const [
      hostingEvents,
      participatingEvents,
      clickedEvents,
      activeEvents,
      friendsEvents,
    ] = await Promise.all([
      this.getHostingEvents(userId),
      this.getParticipatingEvents(userId),
      this.eventRepository.find({
        where: {
          viewEvents: {
            user: { id: userId },
            viewed: ViewEventEnum.CLICKED_ON,
          },
        },
        select: ['id', 'categories', 'tags', 'city'],
        relations: { categories: true, tags: true },
      }),
      this.eventRepository.find({
        where: {
          status: Not(In([StatusEnum.finished, StatusEnum.cancelled])),
          type: Not(EventtypeEnum.private),
          host: { id: Not(userId) },
          participants: { id: Not(userId) },
        },
        select: {
          participantsNumber: true,
          participants: true,
          id: true,
          isOnline: true,
          city: true,
          categories: true,
          dateAndTime: true,
          title: true,
          picture: true,
          status: true,
          type: true,
          tags: true,
        },
        relations: { categories: true, tags: true, participants: true },
      }),
      this.getFriendsEvents(userId),
    ]);

    const hostAndParticipant = [...hostingEvents, ...participatingEvents];

    const [hpCategories, hpTags, hpCities] =
      this.calculateFrequencyMaps(hostAndParticipant);

    const [clickedCategories, clickedTags, clickedCities] =
      this.calculateFrequencyMaps(clickedEvents);

    // Calculate relevance scores for all active events
    const relevanceScores = activeEvents.map((event) => {
      const hpRelevance = this.calculateRelevance(
        event,
        hpCategories,
        hpTags,
        hpCities,
        0.32,
        0.08,
        0.4,
      );

      const clickedRelevance = this.calculateRelevance(
        event,
        clickedCategories,
        clickedTags,
        clickedCities,
        0.08,
        0.02,
        0.1,
      );

      const relevance =
        (hpRelevance + clickedRelevance) *
        this.friendMultiplier(event, friendsEvents);

      return { event, relevance };
    });

    return relevanceScores
      .sort((a, b) => b.relevance - a.relevance)
      .map((item) => item.event);
  }

  /**
   * Calculates frequency maps for categories, tags, and cities from a list of events.
   * @param {EventDB[]} events - The events from which frequency maps are generated.
   * @returns {[Map<number, number>, Map<number, number>, Map<string, number>]} -
   * Three maps containing the frequency of categories, tags, and cities.
   */
  private calculateFrequencyMaps(
    events: EventDB[],
  ): [Map<number, number>, Map<number, number>, Map<string, number>] {
    const categoryFrequencyMap = new Map<number, number>();
    const tagFrequencyMap = new Map<number, number>();
    const cityFrequencyMap = new Map<string, number>();

    events.forEach((event) => {
      event.categories.forEach((category) =>
        categoryFrequencyMap.set(
          category.id,
          (categoryFrequencyMap.get(category.id) || 0) + 1,
        ),
      );
      event.tags.forEach((tag) =>
        tagFrequencyMap.set(tag.id, (tagFrequencyMap.get(tag.id) || 0) + 1),
      );
      cityFrequencyMap.set(
        event.city,
        (cityFrequencyMap.get(event.city) || 0) + 1,
      );
    });

    return [categoryFrequencyMap, tagFrequencyMap, cityFrequencyMap];
  }

  /**
   * Calculates a relevance score for a given event based on frequency maps and weights.
   * @param {EventDB} event - The event for which the relevance score is calculated.
   * @param {Map<number, number>} hpCategories - Frequency map for categories.
   * @param {Map<number, number>} hpTags - Frequency map for tags.
   * @param {Map<string, number>} hpCities - Frequency map for cities.
   * @param {number} categoryWeight - Weight assigned to category relevance.
   * @param {number} tagWeight - Weight assigned to tag relevance.
   * @param {number} cityWeight - Weight assigned to city relevance.
   * @returns {number} - The calculated relevance score for the event.
   */
  private calculateRelevance(
    event: EventDB,
    hpCategories: Map<number, number>,
    hpTags: Map<number, number>,
    hpCities: Map<string, number>,
    categoryWeight: number,
    tagWeight: number,
    cityWeight: number,
  ): number {
    const categoryRelevance =
      event.categories.reduce(
        (sum, category) => sum + (hpCategories.get(category.id) || 0),
        0,
      ) /
      (Array.from(hpCategories.values()).reduce(
        (sum, value) => sum + value,
        0,
      ) || 1);

    const tagRelevance =
      event.tags.reduce((sum, tag) => sum + (hpTags.get(tag.id) || 0), 0) /
      (Array.from(hpTags.values()).reduce((sum, value) => sum + value, 0) || 1);

    const cityRelevance =
      (hpCities.get(event.city) || 0) /
      (Array.from(hpCities.values()).reduce((sum, value) => sum + value, 0) ||
        1);

    return (
      categoryRelevance * categoryWeight * 100 +
      tagRelevance * tagWeight * 100 +
      cityRelevance * cityWeight * 100
    );
  }

  private friendMultiplier(event: EventDB, friendsEvents: EventDB[]) {
    return !!friendsEvents.find((e) => e.id == event.id) ? 1.1 : 1;
  }

  async setEventAsClicked(event: EventDB, user: UserDB) {
    const ve = await this.veRepository.findOne({
      where: { event: { id: event.id }, user: { id: user.id } },
      relations: { event: true, user: true },
    });

    if (ve) {
      ve.viewed = ViewEventEnum.CLICKED_ON;
      await this.veRepository.save(ve);
      return;
    }

    const newVe = new ViewedEventsDB();
    newVe.event = event;
    newVe.user = user;
    newVe.viewed = ViewEventEnum.CLICKED_ON;

    await this.veRepository.save(newVe);
  }
}

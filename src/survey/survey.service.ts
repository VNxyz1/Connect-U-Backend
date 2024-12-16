import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyDB } from '../database/SurveyDB';
import { SurveyEntryDB } from '../database/SurveyEntryDB';
import { EventDB } from '../database/EventDB';
import { UserDB } from '../database/UserDB';
import { CreateSurveyDTO } from './DTO/CreateSurveyDTO';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(SurveyDB)
    private readonly surveyRepository: Repository<SurveyDB>,
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
    @InjectRepository(SurveyEntryDB)
    private readonly surveyEntryRepository: Repository<SurveyEntryDB>,
    @InjectRepository(UserDB)
    private readonly userRepository: Repository<UserDB>,
  ) {}

  /**
   * Creates a new survey for an event.
   *
   * @param user - The user creating the survey.
   * @param eventId - The ID of the event for which the survey is being created.
   * @param body
   * @returns {Promise<SurveyDB>} - The newly created survey.
   *
   * @throws {NotFoundException} If the event does not exist.
   */
  async createSurvey(
    user: UserDB,
    eventId: string,
    body: CreateSurveyDTO,
  ): Promise<SurveyDB> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const newSurvey: SurveyDB = this.surveyRepository.create();
    newSurvey.creator = user;
    newSurvey.event = event;
    newSurvey.title = body.title;
    newSurvey.description = body.description;

    const savedSurvey = await this.surveyRepository.save(newSurvey);

    for (const entryContent of body.entries) {
      const surveyEntry = this.surveyEntryRepository.create();
      surveyEntry.survey = newSurvey;
      surveyEntry.content = entryContent;
      await this.surveyEntryRepository.save(surveyEntry);
    }

    return savedSurvey;
  }

  /**
   * Retrieves a survey by its ID.
   *
   * @param surveyId - The ID of the survey to retrieve.
   * @returns The survey with the specified ID.
   * @throws NotFoundException - If the survey does not exist.
   */
  async getSurveyById(surveyId: number): Promise<SurveyDB> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
      relations: [
        'event',
        'creator',
        'surveyEntries',
        'surveyEntries.users',
        'event.host',
      ],
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    return survey;
  }

  /**
   * Retrieves a survey entry by its ID.
   *
   * @param surveyEntryId - The ID of the survey entry to retrieve.
   * @returns The survey entry with the specified ID.
   * @throws NotFoundException - If the survey does not exist.
   */
  async getSurveyEntryById(surveyEntryId: number): Promise<SurveyEntryDB> {
    const surveyEntry = await this.surveyEntryRepository.findOne({
      where: { id: surveyEntryId },
      relations: ['survey', 'survey.event', 'users'],
    });

    if (!surveyEntry) {
      throw new NotFoundException('Survey entry not found');
    }

    return surveyEntry;
  }

  /**
   * Retrieves all surveys for a specific event.
   *
   * @param eventId - The ID of the event.
   * @returns An array of surveys for the event.
   * @throws NotFoundException If the event does not exist.
   * @throws ForbiddenException If the user is not the host or a participant of the event.
   */
  async getSurveysForEvent(eventId: string): Promise<SurveyDB[]> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: [
        'surveys',
        'host',
        'surveys.creator',
        'surveys.surveyEntries',
        'surveys.surveyEntries.users',
      ],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event.surveys;
  }

  /**
   * Adds a user's vote to a survey entry.
   *
   * @param user - The user voting for the survey entry.
   * @param entry - survey entry to add the user for.
   * @throws {NotFoundException} If the survey entry is not found.
   * @throws {ForbiddenException} If the user has already voted for the entry.
   */
  async addVote(user: UserDB, entry: SurveyEntryDB): Promise<SurveyEntryDB> {
    const userVotes = entry.users;
    const hasVoted = userVotes.some((voter) => voter.id === user.id);

    if (hasVoted) {
      throw new ForbiddenException('You have already voted for this entry');
    }

    user.surveyEntries.push(entry);

    await this.userRepository.save(user);

    return entry;
  }

  /**
   * Removes a user's vote from a survey entry.
   *
   * @param user - The user removing their vote.
   * @param entry - The survey entry to remove the user from.
   * @throws {ForbiddenException} If the user has not voted for the entry.
   */
  async removeVote(user: UserDB, entry: SurveyEntryDB): Promise<SurveyEntryDB> {
    const userVotes = user.surveyEntries || [];
    const hasVoted = userVotes.some((votedEntry) => votedEntry.id === entry.id);

    if (!hasVoted) {
      throw new ForbiddenException(
        'You cannot remove a vote you have not assigned',
      );
    }

    user.surveyEntries = userVotes.filter(
      (votedEntry) => votedEntry.id !== entry.id,
    );

    await this.userRepository.save(user);

    return entry;
  }

  /**
   * Deletes a survey by its ID.
   *
   * @param survey - The survey to delete.
   */
  async deleteSurvey(survey: SurveyDB): Promise<void> {
    await this.surveyRepository.remove(survey);
  }
}

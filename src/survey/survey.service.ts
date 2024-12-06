import { Injectable, NotFoundException } from '@nestjs/common';
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
    body: CreateSurveyDTO
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
      const surveyEntry = this.surveyEntryRepository.create()
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
      relations: ['event', 'creator', 'surveyEntries'],
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    return survey;
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

import { Test, TestingModule } from '@nestjs/testing';
import { SurveyService } from './survey.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SurveyDB } from '../database/SurveyDB';
import { SurveyEntryDB } from '../database/SurveyEntryDB';
import { EventDB } from '../database/EventDB';
import { UserDB } from '../database/UserDB';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SurveyService', () => {
  let surveyService: SurveyService;
  let surveyRepository: jest.Mocked<Repository<SurveyDB>>;
  let surveyEntryRepository: jest.Mocked<Repository<SurveyEntryDB>>;
  let eventRepository: jest.Mocked<Repository<EventDB>>;
  let userRepository: jest.Mocked<Repository<UserDB>>;

  const mockUser: UserDB = { id: '1', username: 'testUser', surveyEntries: [] } as UserDB;
  const mockEvent: EventDB = {
    id: '1',
    host: mockUser,
    participants: [mockUser],
    surveys: [],
  } as EventDB;
  const mockSurvey: SurveyDB = {
    id: 1,
    title: 'Test Survey',
    description: 'Test Description',
    creator: mockUser,
    event: mockEvent,
    surveyEntries: [],
  } as SurveyDB;
  const mockSurveyEntry: SurveyEntryDB = {
    id: 1,
    content: 'Test Entry',
    survey: mockSurvey,
    users: [],
  } as SurveyEntryDB;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SurveyService,
        {
          provide: getRepositoryToken(SurveyDB),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SurveyEntryDB),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EventDB),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserDB),
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    surveyService = module.get<SurveyService>(SurveyService);
    surveyRepository = module.get(getRepositoryToken(SurveyDB));
    surveyEntryRepository = module.get(getRepositoryToken(SurveyEntryDB));
    eventRepository = module.get(getRepositoryToken(EventDB));
    userRepository = module.get(getRepositoryToken(UserDB));
  });

  describe('createSurvey', () => {
    it('should create a new survey successfully', async () => {
      eventRepository.findOne.mockResolvedValue(mockEvent);

      surveyRepository.create.mockReturnValue(mockSurvey  as SurveyDB);
      surveyRepository.save.mockResolvedValue(mockSurvey  as SurveyDB);

      surveyEntryRepository.create.mockImplementation((entry) => ({
        ...mockSurveyEntry,
        content: entry?.content,
        survey: entry?.survey,
      } as SurveyEntryDB));
      surveyEntryRepository.save.mockResolvedValue(mockSurveyEntry as SurveyEntryDB);

      const result = await surveyService.createSurvey(mockUser, '1', {
        title: 'Test Survey',
        description: 'Test Description',
        entries: ['Entry 1', 'Entry 2'],
      });

      expect(eventRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(surveyRepository.create).toHaveBeenCalled();
      expect(surveyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          creator: mockUser,
          event: mockEvent,
          title: 'Test Survey',
          description: 'Test Description',
        }),
      );
      expect(surveyEntryRepository.create).toHaveBeenCalledTimes(2);
      expect(surveyEntryRepository.save).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockSurvey);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(
        surveyService.createSurvey(mockUser, '1', {
          title: 'Test Survey',
          description: 'Test Description',
          entries: ['Entry 1', 'Entry 2'],
        }),
      ).rejects.toThrow(new NotFoundException('Event not found'));
    });
  });


  describe('getSurveyById', () => {
    it('should retrieve a survey by its ID', async () => {
      surveyRepository.findOne.mockResolvedValue(mockSurvey);

      const result = await surveyService.getSurveyById(1);

      expect(surveyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['event', 'creator', 'surveyEntries', 'surveyEntries.users'],
      });
      expect(result).toEqual(mockSurvey);
    });

    it('should throw NotFoundException if the survey does not exist', async () => {
      surveyRepository.findOne.mockResolvedValue(null);

      await expect(surveyService.getSurveyById(1)).rejects.toThrow(
        new NotFoundException('Survey not found'),
      );
    });
  });

  describe('getSurveyEntryById', () => {
    it('should retrieve a survey entry by its ID', async () => {
      surveyEntryRepository.findOne.mockResolvedValue(mockSurveyEntry);

      const result = await surveyService.getSurveyEntryById(1);

      expect(surveyEntryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['survey', 'survey.event', 'users'],
      });
      expect(result).toEqual(mockSurveyEntry);
    });

    it('should throw NotFoundException if the survey entry does not exist', async () => {
      surveyEntryRepository.findOne.mockResolvedValue(null);

      await expect(surveyService.getSurveyEntryById(1)).rejects.toThrow(
        new NotFoundException('Survey entry not found'),
      );
    });
  });


  describe('addVote', () => {
    it('should add a user vote to a survey entry', async () => {
      userRepository.save.mockResolvedValue(mockUser);

      const result = await surveyService.addVote(mockUser, mockSurveyEntry);

      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockSurveyEntry);
    });
  });

  describe('removeVote', () => {
    it('should remove a user vote from a survey entry', async () => {
      mockUser.surveyEntries = [mockSurveyEntry];
      userRepository.save.mockResolvedValue(mockUser);

      const result = await surveyService.removeVote(mockUser, mockSurveyEntry);

      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockSurveyEntry);
    });

    it('should throw ForbiddenException if the user has not voted for the entry', async () => {
      mockUser.surveyEntries = [];

      await expect(
        surveyService.removeVote(mockUser, mockSurveyEntry),
      ).rejects.toThrow(
        new ForbiddenException('You cannot remove a vote you have not assigned'),
      );
    });
  });

  describe('deleteSurvey', () => {
    it('should delete a survey successfully', async () => {
      surveyRepository.remove.mockResolvedValue(undefined);

      await surveyService.deleteSurvey(mockSurvey);

      expect(surveyRepository.remove).toHaveBeenCalledWith(mockSurvey);
    });
  });
});

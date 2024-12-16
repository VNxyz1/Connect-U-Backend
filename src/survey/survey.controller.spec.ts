import * as request from 'supertest';
import { Agent } from 'supertest';
import {
  HttpStatus,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { SurveyController } from './survey.controller';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { mockAuthService } from '../auth/auth.service.spec';
import { CreateSurveyDTO } from './DTO/CreateSurveyDTO';
import { GetSurveyDetailsDTO } from './DTO/GetSurveyDetailsDTO';
import { JWTConstants } from '../auth/constants';
import { mockProviders } from '../../test/mock-services';
import { mockSurveyEntry, mockSurveyService } from './survey.service.spec';
import { mockUtilsService } from '../utils/utils.service.spec';
import { mockUserService } from '../user/user.service.spec';
import { SocketGateway } from '../socket/socket.gateway';

describe('SurveyController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SurveyController],
      providers: [
        SocketGateway,
        ...mockProviders,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn().mockReturnValue({
              sub: 'uuIdMock',
              username: 'testUser',
              email: 'test@email.com',
            }),
          },
        },
        {
          provide: JWTConstants,
          useValue: {
            getConstants: jest.fn().mockReturnValue({ secret: 'secret_token' }),
          },
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    agent = request.agent(app.getHttpServer());
    await app.init();
  });

  describe('POST /:eventId - createSurvey', () => {
    it('should create a new survey with valid data', async () => {
      const tokens = await mockAuthService.signIn();
      const createSurveyDTO: CreateSurveyDTO = {
        title: 'Event Feedback Survey',
        description: 'A survey to gather feedback from participants',
        entries: ['Did you like the event?', 'What could we improve?'],
      };

      return agent
        .post('/survey/1')
        .send(createSurveyDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'Survey was created successfully',
            surveyId: mockSurvey.id,
          });
        });
    });

    it('should fail when the title is missing', async () => {
      const tokens = await mockAuthService.signIn();
      const createSurveyDTO = {
        description: 'A survey to gather feedback from participants',
        entries: ['Did you like the event?', 'What could we improve?'],
      };

      return agent
        .post('/survey/1')
        .send(createSurveyDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toContain('Title is required');
        });
    });

    it('should fail when entries are less than the minimum required', async () => {
      const tokens = await mockAuthService.signIn();
      const createSurveyDTO: CreateSurveyDTO = {
        title: 'Event Feedback Survey',
        description: 'A survey to gather feedback from participants',
        entries: ['Did you like the event?'], // Only 1 entry
      };

      return agent
        .post('/survey/1')
        .send(createSurveyDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toContain(
            'You must provide at least 2 survey entries',
          );
        });
    });

    it('should fail when the entries array exceeds the maximum size', async () => {
      const tokens = await mockAuthService.signIn();
      const createSurveyDTO: CreateSurveyDTO = {
        title: 'Event Feedback Survey',
        description: 'A survey to gather feedback from participants',
        entries: Array(51).fill('Test entry'), // 51 entries
      };

      return agent
        .post('/survey/1')
        .send(createSurveyDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toContain(
            'You can have a maximum of 50 survey entries',
          );
        });
    });

    it('should allow a missing description', async () => {
      const tokens = await mockAuthService.signIn();
      const createSurveyDTO: CreateSurveyDTO = {
        title: 'Event Feedback Survey',
        entries: ['Did you like the event?', 'What could we improve?'],
      };

      return agent
        .post('/survey/1')
        .send(createSurveyDTO)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'Survey was created successfully',
            surveyId: mockSurvey.id,
          });
        });
    });
  });

  describe('GET /details/:surveyId - getSurveyById', () => {
    it('should return a survey by its ID', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(mockSurveyService, 'getSurveyById')
        .mockResolvedValue(mockSurvey);
      jest
        .spyOn(mockUtilsService, 'isHostOrParticipant')
        .mockResolvedValue(true);

      return agent
        .get('/survey/details/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual(mockSurveyDetailsDTO);
        });
    });

    it('should return 404 if the survey is not found', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(mockSurveyService, 'getSurveyById')
        .mockRejectedValue(new NotFoundException('Survey not found'));

      return agent
        .get('/survey/details/999')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.NOT_FOUND)
        .expect((response) => {
          expect(response.body.message).toBe('Survey not found');
        });
    });
  });

  describe('PATCH /:surveyEntryId - updateListEntry', () => {
    it('should add a user to the survey entry when not already added', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(mockSurveyService, 'getSurveyEntryById')
        .mockResolvedValue(mockSurveyEntry);
      jest
        .spyOn(mockUtilsService, 'isHostOrParticipant')
        .mockResolvedValue(true);
      jest.spyOn(mockSurveyService, 'addVote').mockResolvedValue(undefined);

      return agent
        .patch('/survey/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.message).toBe(
            'Survey entry was updated successfully',
          );
        });
    });

    it('should remove a user from the survey entry when already added', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(mockSurveyService, 'getSurveyEntryById')
        .mockResolvedValue(mockSurveyEntry);
      jest
        .spyOn(mockUtilsService, 'isHostOrParticipant')
        .mockResolvedValue(true);
      jest.spyOn(mockSurveyService, 'removeVote').mockResolvedValue(undefined);

      return agent
        .patch('/survey/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body.message).toBe(
            'Survey entry was updated successfully',
          );
        });
    });
  });

  describe('DELETE /:surveyId - deleteSurvey', () => {
    it('should delete a survey successfully when the user is authorized', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(mockSurveyService, 'getSurveyById')
        .mockResolvedValue(mockSurvey);
      jest.spyOn(mockUserService, 'findById').mockResolvedValue(mockUser);
      jest
        .spyOn(mockSurveyService, 'deleteSurvey')
        .mockResolvedValue(undefined);

      return agent
        .delete('/survey/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual({
            ok: true,
            message: 'Survey was deleted successfully',
          });
          expect(mockSurveyService.deleteSurvey).toHaveBeenCalledWith(
            mockSurvey,
          );
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});

const mockUser = {
  id: '1',
  isUser: false,
  username: 'testUser',
  firstName: 'test',
  city: 'giessen',
  profilePicture: 'string',
  pronouns: 'she/her',
  age: 23,
  profileText: 'eee',
};

export const mockSurvey = {
  id: 1,
  title: 'Test Survey',
  description: 'Test Survey Description',
  creator: mockUser,
  questions: [],
  event: { id: '1', host: mockUser },
};

const mockSurveyDetailsDTO: GetSurveyDetailsDTO = {
  id: mockSurvey.id,
  title: mockSurvey.title,
  description: mockSurvey.description,
  creator: {
    isUser: mockUser.isUser,
    id: mockUser.id,
    age: 23,
    username: mockUser.username,
    firstName: mockUser.firstName,
    city: mockUser.city,
    profilePicture: mockUser.profilePicture,
    pronouns: mockUser.pronouns,
    profileText: mockUser.profileText,
  },
  surveyEntries: [],
};

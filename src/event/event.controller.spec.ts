import * as request from 'supertest';
import { Agent } from 'supertest';
import { Test } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { EventController } from './event.controller';
import { AuthGuard } from '../auth/auth.guard';
import { JWTConstants } from '../auth/constants';
import { AuthService } from '../auth/auth.service';
import { mockAuthService } from '../auth/auth.service.spec';
import { mockProviders } from '../../test/mock-services';
import { UtilsService } from '../utils/utils.service';
import { CreateEventDTO } from './DTO/CreateEventDTO';
import { EventtypeEnum } from '../database/enums/EventtypeEnum';
import { GenderEnum } from '../database/enums/GenderEnum';

describe('EventController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        ...mockProviders,
        UtilsService,
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
            getConstants: jest.fn().mockReturnValue({ secret: 'seret_token' }),
          },
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: jest.fn().mockReturnValue(true),
      })
      .compile();

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

  it('/POST event', async () => {
    const tokens = await mockAuthService.signIn();
    return agent
      .post('/event')
      .send(mockCreateEvent)
      .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
      .expect('Content-Type', /json/)
      .expect(HttpStatus.CREATED)
      .expect({ ok: true, message: 'Event was created' });
  });

  it('should return 400 if required fields are missing', async () => {
    const tokens = await mockAuthService.signIn();
    const invalidEvent = {
      ...mockCreateEvent,
      title: '',
    };

    return agent
      .post('/event')
      .send(invalidEvent)
      .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
      .expect('Content-Type', /json/)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((response) => {
        expect(response.body.message).toContain('Title cannot contain only whitespace');
      });
  });

  it('should return 400 if endAge is less than startAge', async () => {
    const tokens = await mockAuthService.signIn();
    const invalidEvent = {
      ...mockCreateEvent,
      startAge: 30,
      endAge: 25,
    };

    return agent
      .post('/event')
      .send(invalidEvent)
      .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
      .expect('Content-Type', /json/)
      .expect(HttpStatus.BAD_REQUEST)
      .expect((response) => {
        expect(response.body.message).toContain(
          'The start age must be lesser then the end age.',
        );
      });
  });

  describe('EventController - getAllEvents', () => {
    it('/GET event/allEvents should return all events', async () => {

      return agent
        .get('/event/allEvents')
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          response.body.forEach((event) => {
            expect(event).toHaveProperty('id');
            expect(event).toHaveProperty('title');
            expect(event).toHaveProperty('dateAndTime');
          });
        });
    });
  });

  describe('CreateEventDTO Validation', () => {
    it('should return 400 if categories is missing', async () => {
      const tokens = await mockAuthService.signIn();
      const invalidEvent = {
        ...mockCreateEvent,
        categories: undefined,
      };

      return agent
        .post('/event')
        .send(invalidEvent)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toContain('categories should not be empty');
        });
    });

    it('should return 400 if dateAndTime is invalid', async () => {
      const tokens = await mockAuthService.signIn();
      const invalidEvent = {
        ...mockCreateEvent,
        dateAndTime: 'invalid-date',
      };

      return agent
        .post('/event')
        .send(invalidEvent)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toContain('dateAndTime must be a valid ISO 8601 date string');
        });
    });

    it('should return 400 if participantsNumber is below minimum', async () => {
      const tokens = await mockAuthService.signIn();
      const invalidEvent = {
        ...mockCreateEvent,
        participantsNumber: -1,
      };

      return agent
        .post('/event')
        .send(invalidEvent)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toContain('Participants number must be at least 2');
        });
    });

    it('should return 400 if title is not provided', async () => {
      const tokens = await mockAuthService.signIn();
      const invalidEvent = {
        ...mockCreateEvent,
        title: '',
      };

      return agent
        .post('/event')
        .send(invalidEvent)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toContain('title should not be empty');
        });
    });


    it('should return 400 if zipCode is missing', async () => {
      const tokens = await mockAuthService.signIn();
      const invalidEvent = {
        ...mockCreateEvent,
        zipCode: undefined,
      };

      return agent
        .post('/event')
        .send(invalidEvent)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toContain('zipCode should not be empty');
        });
    });
  });



  afterAll(async () => {
    await app.close();
  });
});

const mockCreateEvent: CreateEventDTO = {
  categories: [1],
  city: 'Gießen',
  dateAndTime: '2027-11-12T12:00:00Z',
  description:
    'Kommen Sie zu unserem spannenden und interaktiven Coding-Workshop!',
  endAge: 25,
  isOnline: false,
  participantsNumber: 4,
  preferredGenders: [GenderEnum.Diverse, GenderEnum.Female],
  showAddress: false,
  startAge: 20,
  street: 'Hauptstraße',
  streetNumber: '123',
  title: 'Java-Programmierung für Anfänger',
  type: EventtypeEnum.private,
  zipCode: '12345',
};


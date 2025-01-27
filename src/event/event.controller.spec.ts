import * as request from 'supertest';
import { Agent } from 'supertest';
import { Test } from '@nestjs/testing';
import {
  HttpStatus,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import { EventController } from './event.controller';
import { AuthTokenPayload, JWTConstants } from '../auth/constants';
import { AuthService } from '../auth/auth.service';
import { mockAuthService } from '../auth/auth.service.spec';
import { mockProviders } from '../../test/mock-services';
import { UtilsService } from '../utils/utils.service';
import { CreateEventDTO } from './DTO/CreateEventDTO';
import { EventtypeEnum } from '../database/enums/EventtypeEnum';
import { GenderEnum } from '../database/enums/GenderEnum';
import { UserDB } from '../database/UserDB';
import { EventDB } from '../database/EventDB';
import { StatusEnum } from '../database/enums/StatusEnum';
import { GetEventDetailsDTO } from './DTO/GetEventDetailsDTO';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockEventRepository } from './event.service.spec';
import { UserService } from '../user/user.service';
import { SocketGateway } from '../socket/socket.gateway';

describe('EventController', () => {
  let app: INestApplication;
  let agent: Agent;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        ...mockProviders,
        SocketGateway,
        UtilsService,
        {
          provide: getRepositoryToken(EventDB),
          useValue: mockEventRepository,
        },
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
        expect(response.body.message).toContain(
          'Title cannot contain only whitespace',
        );
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

  describe('EventController - getEventById', () => {
    it('/GET eventDetails/:eventId should return event details for a valid ID', async () => {
      jest
        .spyOn(app.get(EventController).eventService, 'getEventById')
        .mockResolvedValue(MockEvent);

      return agent
        .get(`/event/eventDetails/${MockEvent.id}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual(MockEventDetailsDTO);
          expect(response.body).toHaveProperty('id', MockEventDetailsDTO.id);
          expect(response.body).toHaveProperty(
            'title',
            MockEventDetailsDTO.title,
          );
          expect(response.body).toHaveProperty(
            'dateAndTime',
            MockEventDetailsDTO.dateAndTime,
          );
        });
    });

    it('/GET eventDetails/:eventId should return event details for a valid ID, and not show address when showAddress is false', async () => {
      const eventWithHiddenAddress = {
        ...MockPublicEvent,
        showAddress: false,
      };
      jest
        .spyOn(app.get(EventController).eventService, 'getEventById')
        .mockResolvedValue(eventWithHiddenAddress);

      return agent
        .get(`/event/eventDetails/${eventWithHiddenAddress.id}`)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toEqual(MockEventDetailsWOAddress);
          expect(response.body).toHaveProperty('id', MockEventDetailsDTO.id);
          expect(response.body).toHaveProperty(
            'title',
            MockEventDetailsDTO.title,
          );
          expect(response.body).toHaveProperty(
            'dateAndTime',
            MockEventDetailsDTO.dateAndTime,
          );
          expect(response.body).not.toHaveProperty('address');
        });
    });

    it('/GET eventDetails/:eventId should return 404 for an invalid ID', async () => {
      const tokens = await mockAuthService.signIn();
      const invalidEventId = '999';

      jest
        .spyOn(app.get(EventController).eventService, 'getEventById')
        .mockRejectedValue(new NotFoundException('Event not found'));

      return agent
        .get(`/event/eventDetails/${invalidEventId}`)
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.NOT_FOUND)
        .expect((response) => {
          expect(response.body.message).toBe('Event not found');
        });
    });
  });

  describe('EventController - getAllEvents', () => {
    it('/GET event/allEvents should return all events', async () => {
      return agent
        .get('/event/allEvents?page=0&size=12')
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          response.body.forEach((event: any) => {
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
          expect(response.body.message).toContain(
            'categories should not be empty',
          );
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
          expect(response.body.message).toContain(
            'dateAndTime must be a valid ISO 8601 date string',
          );
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
          expect(response.body.message).toContain(
            'Participants number must be at least 2',
          );
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
          expect(response.body.message).toContain(
            'zipCode should not be empty',
          );
        });
    });
  });

  describe('EventController - getHostingEvents', () => {
    it('/GET event/hostingEvents should return events hosted by the user', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(JwtService), 'verifyAsync')
        .mockResolvedValue(mockAuthPayload);

      return agent
        .get('/event/hostingEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          response.body.forEach((event: any) => {
            expect(event).toHaveProperty('id');
            expect(event).toHaveProperty('title');
            expect(event).toHaveProperty('dateAndTime');
            expect(event).toHaveProperty('city');
          });
        });
    });

    it('/GET event/hostingEvents should return 404 if user has no hosted events', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(EventController).eventService, 'getHostingEvents')
        .mockRejectedValue(
          new NotFoundException('No events found for this user'),
        );

      return agent
        .get('/event/hostingEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.NOT_FOUND)
        .expect((response) => {
          expect(response.body.message).toBe('No events found for this user');
        });
    });
  });

  describe('EventController - getParticipatingEvents', () => {
    it('/GET event/participatingEvents should return events where the user is a participant', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(JwtService), 'verifyAsync')
        .mockResolvedValue(mockAuthPayload);

      return agent
        .get('/event/participatingEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          response.body.forEach((event: any) => {
            expect(event).toHaveProperty('id');
            expect(event).toHaveProperty('title');
            expect(event).toHaveProperty('dateAndTime');
            expect(event).toHaveProperty('city');
          });
        });
    });

    it('/GET event/participatingEvents should return 404 if no participating events are found', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(EventController).eventService, 'getParticipatingEvents')
        .mockRejectedValue(new NotFoundException('No events found'));

      return agent
        .get('/event/participatingEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.NOT_FOUND)
        .expect((response) => {
          expect(response.body.message).toBe('No events found');
        });
    });
  });

  describe('EventController - addUserToEvent', () => {
    it('/POST event/join/:eventId should add user to event participants list', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(EventController).eventService, 'addUserToEvent')
        .mockResolvedValue(undefined);

      jest
        .spyOn(app.get(EventController).eventService, 'getEventById')
        .mockResolvedValue(MockPublicEvent);

      return agent
        .post('/event/join/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.CREATED)
        .expect({
          ok: true,
          message: 'user was added to participant list',
        });
    });

    it('/POST event/join/:eventId should return 400 if the event type is not public', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(EventController).eventService, 'getEventById')
        .mockResolvedValue(MockPrivateEvent);

      return agent
        .post('/event/join/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toBe('Event has to be public');
        });
    });
  });

  describe('EventController - removeUserFromEvent', () => {
    it('/POST event/leave/:eventId should remove user from event participants list', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(EventController).eventService, 'removeUserFromEvent')
        .mockResolvedValue(MockPublicEvent);

      return agent
        .post('/event/leave/1')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect({
          ok: true,
          message: 'User was removed from participant list',
        });
    });
  });

  describe('EventController - getUpcomingEvents', () => {
    it('/GET event/upcoming should return upcoming events of the user as host and participant', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(JwtService), 'verifyAsync')
        .mockResolvedValue(mockAuthPayload);

      return agent
        .get('/event/upcoming')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          response.body.forEach((event: any) => {
            expect(event).toHaveProperty('id');
            expect(event).toHaveProperty('title');
            expect(event).toHaveProperty('dateAndTime');
            expect(event).toHaveProperty('city');
          });
        });
    });

    it('/GET event/upcoming should return 404 if user has no hosted events', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(
          app.get(EventController).eventService,
          'getUpcomingAndLiveEvents',
        )
        .mockRejectedValue(
          new NotFoundException('No events found for this user'),
        );

      return agent
        .get('/event/upcoming')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.NOT_FOUND)
        .expect((response) => {
          expect(response.body.message).toBe('No events found for this user');
        });
    });
  });

  describe('EventController - getFyPage', () => {
    it('should return the fyPage of the logged in user', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(JwtService), 'verifyAsync')
        .mockResolvedValue(mockAuthPayload);

      return agent
        .get('/event/fy-page?page=0&size=12')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          response.body.forEach((event: any) => {
            expect(event).toHaveProperty('id');
            expect(event).toHaveProperty('title');
            expect(event).toHaveProperty('dateAndTime');
          });
        });
    });
  });

  describe('EventController - getFilteredEvents', () => {
    it('/GET event/filteredEvents should return filtered events based on query parameters', async () => {
      const tokens = await mockAuthService.signIn();

      jest
        .spyOn(app.get(JwtService), 'verifyAsync')
        .mockResolvedValue(mockAuthPayload);

      jest.spyOn(app.get(UserService), 'findById').mockResolvedValue(mockUser);

      const validQuery = {
        isOnline: true,
        isInPlace: false,
        isPublic: true,
        isHalfPublic: false,
        genders: [1, 2],
        page: 0,
        size: 12,
      };

      jest
        .spyOn(app.get(EventController).eventService, 'getFilteredEvents')
        .mockResolvedValue([[MockPublicEvent], 2]);

      return agent
        .get('/event/filteredEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .query(validQuery)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body.total).toBe(2);
          expect(response.body.events[0]).toHaveProperty('id');
          expect(response.body.events[0]).toHaveProperty('title');
          expect(response.body.events[0]).toHaveProperty('dateAndTime');
        });
    });

    it('/GET event/filteredEvents should return 400 if both isOnline and isInPlace are false', async () => {
      const invalidQuery = {
        isOnline: false,
        isInPlace: false,
        isPublic: true,
        isHalfPublic: false,
        genders: [1, 2],
        page: 0,
        size: 12,
      };

      return agent
        .get('/event/filteredEvents')
        .query(invalidQuery)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toBe(
            'An event must be either online or in place.',
          );
        });
    });

    it('/GET event/filteredEvents should return 400 if both isPublic and isHalfPublic are false', async () => {
      const invalidQuery = {
        isOnline: true,
        isInPlace: false,
        isPublic: false,
        isHalfPublic: false,
        genders: [1, 2],
        page: 0,
        size: 12,
      };

      return agent
        .get('/event/filteredEvents')
        .query(invalidQuery)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toBe(
            'An event must be either public or half public.',
          );
        });
    });

    it('/GET event/filteredEvents should return events filtered by date range', async () => {
      const tokens = await mockAuthService.signIn();

      const validQuery = {
        isOnline: true,
        isInPlace: false,
        isPublic: true,
        isHalfPublic: false,
        genders: [1, 2],
        dates: ['2025-01-15', '2025-01-20'],
        page: 0,
        size: 12,
      };

      jest
        .spyOn(app.get(EventController).eventService, 'getFilteredEvents')
        .mockResolvedValue([[MockPublicEvent], 2]);

      return agent
        .get('/event/filteredEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .query(validQuery)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body.total).toBe(2);
          expect(response.body.events[0]).toHaveProperty('id');
          expect(response.body.events[0]).toHaveProperty('title');
          expect(response.body.events[0]).toHaveProperty('dateAndTime');
        });
    });

    it('/GET event/filteredEvents should return events filtered by categories', async () => {
      const tokens = await mockAuthService.signIn();

      const validQuery = {
        isOnline: true,
        isInPlace: false,
        isPublic: true,
        isHalfPublic: false,
        genders: [1, 2],
        categories: [1, 2, 3],
        page: 0,
        size: 12,
      };

      jest
        .spyOn(app.get(EventController).eventService, 'getFilteredEvents')
        .mockResolvedValue([[MockPublicEvent], 2]);

      return agent
        .get('/event/filteredEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .query(validQuery)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body.total).toBe(2);
          expect(response.body.events[0]).toHaveProperty('id');
          expect(response.body.events[0]).toHaveProperty('title');
          expect(response.body.events[0]).toHaveProperty('dateAndTime');
        });
    });

    it('/GET event/filteredEvents should return events filtered by cities', async () => {
      const tokens = await mockAuthService.signIn();

      const validQuery = {
        isOnline: true,
        isInPlace: false,
        isPublic: true,
        isHalfPublic: false,
        genders: [1, 2],
        cities: [35390, 61200],
        page: 0,
        size: 12,
      };

      jest
        .spyOn(app.get(EventController).eventService, 'getFilteredEvents')
        .mockResolvedValue([[MockPublicEvent], 2]);

      return agent
        .get('/event/filteredEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .query(validQuery)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body.total).toBe(2);
          expect(response.body.events[0]).toHaveProperty('id');
          expect(response.body.events[0]).toHaveProperty('title');
          expect(response.body.events[0]).toHaveProperty('dateAndTime');
        });
    });

    it('/GET event/filteredEvents should return events filtered by friends participation', async () => {
      const tokens = await mockAuthService.signIn();

      const validQuery = {
        isOnline: true,
        isInPlace: false,
        isPublic: true,
        isHalfPublic: false,
        genders: [1, 2],
        filterFriends: true,
        page: 0,
        size: 12,
      };

      jest
        .spyOn(app.get(EventController).eventService, 'getFilteredEvents')
        .mockResolvedValue([[MockPublicEvent], 2]);

      return agent
        .get('/event/filteredEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .query(validQuery)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body.total).toBe(2);
          expect(response.body.events[0]).toHaveProperty('id');
          expect(response.body.events[0]).toHaveProperty('title');
          expect(response.body.events[0]).toHaveProperty('dateAndTime');
        });
    });

    it('/GET event/filteredEvents should return 400 for invalid date format', async () => {
      const invalidQuery = {
        isOnline: true,
        isInPlace: false,
        isPublic: true,
        isHalfPublic: false,
        genders: [1, 2],
        dates: ['2025-01-15', 'invalid-date'],
        page: 0,
        size: 12,
      };

      return agent
        .get('/event/filteredEvents')
        .query(invalidQuery)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((response) => {
          expect(response.body.message).toEqual([
            'each value in dates must be a valid ISO 8601 date string',
          ]);
        });
    });

    it('/GET event/filteredEvents should return events filtered by tags', async () => {
      const tokens = await mockAuthService.signIn();

      const validQuery = {
        isOnline: true,
        isInPlace: false,
        isPublic: true,
        isHalfPublic: false,
        genders: [1, 2],
        tags: [1, 2],
        page: 0,
        size: 12,
      };

      jest
        .spyOn(app.get(EventController).eventService, 'getFilteredEvents')
        .mockResolvedValue([[MockPublicEvent], 2]);

      return agent
        .get('/event/filteredEvents')
        .set('Cookie', [`refresh_token=${tokens.refresh_token}`])
        .query(validQuery)
        .expect('Content-Type', /json/)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body.total).toBe(2);
          expect(response.body.events[0]).toHaveProperty('id');
          expect(response.body.events[0]).toHaveProperty('title');
          expect(response.body.events[0]).toHaveProperty('dateAndTime');
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

const mockUser: UserDB = {
  id: '1',
  email: 'host@example.com',
  username: 'hostuser',
  password: 'hashedpassword',
  firstName: 'Host',
  lastName: 'User',
  birthday: '1980-01-01',
  phoneNumber: '+1234567890',
  profilePicture: 'profile.png',
  pronouns: 'he/him',
  profileText: 'Event organizer and tech enthusiast.',
  streetNumber: '123',
  street: 'Main St',
  zipCode: '12345',
  city: 'Anytown',
  isVerified: true,
  gender: 2,
  surveys: [],
  lists: [],
  hostedEvents: [],
  requests: [],
  participatedEvents: [],
  favoritedEvents: [],
  memories: [],
  friends: [],
  friendOf: [],
  listEntries: [],
  achievements: Promise.resolve([]),
  surveyEntries: [],
  messages: [],
  reactions: [],
  tags: [],
  unreadMessages: [],
  viewEvents: [],
};
export const MockPublicEvent: EventDB = {
  id: '1',
  timestamp: '2026-01-14T18:54:56',
  title: 'Tech Conference 2024',
  description: 'A conference for tech enthusiasts.',
  dateAndTime: '2026-01-14T18:54:56',
  categories: [],
  host: mockUser,
  type: EventtypeEnum.public,
  isOnline: false,
  showAddress: false,
  streetNumber: '456',
  street: 'Tech Ave',
  zipCode: '67890',
  city: 'Tech City',
  participantsNumber: 100,
  preferredGenders: [],
  status: StatusEnum.upcoming,
  picture: '',
  startAge: 0,
  endAge: 0,
  participants: [],
  requests: [],
  lists: [],
  surveys: [],
  favorited: [],
  memories: [],
  tags: [],
  messages: [],
  viewEvents: [],
};

export const MockEvent: EventDB = {
  id: '1',
  timestamp: '2026-01-14T18:54:56',
  title: 'Tech Conference 2024',
  description: 'A conference for tech enthusiasts.',
  dateAndTime: '2026-01-14T18:54:56',
  categories: [],
  host: mockUser,
  type: EventtypeEnum.public,
  isOnline: false,
  showAddress: true,
  streetNumber: '456',
  street: 'Tech Ave',
  zipCode: '67890',
  city: 'Tech City',
  participantsNumber: 100,
  preferredGenders: [],
  status: StatusEnum.upcoming,
  picture: '',
  startAge: 0,
  endAge: 0,
  participants: [],
  requests: [],
  lists: [],
  surveys: [],
  favorited: [],
  memories: [],
  tags: [],
  messages: [],
  viewEvents: [],
};

const MockPrivateEvent: EventDB = {
  id: '1',
  timestamp: '2022-12-01T10:00:00',
  title: 'Tech Conference 2024',
  description: 'A conference for tech enthusiasts.',
  dateAndTime: '2026-01-14T18:54:56',
  categories: [],
  host: mockUser,
  type: EventtypeEnum.private,
  isOnline: false,
  showAddress: true,
  streetNumber: '456',
  street: 'Tech Ave',
  zipCode: '67890',
  city: 'Tech City',
  participantsNumber: 100,
  preferredGenders: [],
  status: StatusEnum.upcoming,
  picture: '',
  startAge: 0,
  endAge: 0,
  participants: [],
  requests: [],
  surveys: [],
  lists: [],
  favorited: [],
  memories: [],
  tags: [],
  messages: [],
  viewEvents: [],
};

const MockEventDetailsDTO: GetEventDetailsDTO = {
  id: '1',
  categories: [],
  preferredGenders: [],
  host: null,
  isHost: false,
  isParticipant: false,
  dateAndTime: '2026-01-14T18:54:56',
  title: 'Tech Conference 2024',
  description: 'A conference for tech enthusiasts.',
  picture: '',
  status: StatusEnum.upcoming,
  type: EventtypeEnum.public,
  isOnline: false,
  streetNumber: '456',
  street: 'Tech Ave',
  zipCode: '67890',
  city: 'Tech City',
  participantsNumber: 0,
  maxParticipantsNumber: 100,
  participants: [],
  startAge: null,
  endAge: null,
};

const MockEventDetailsWOAddress: GetEventDetailsDTO = {
  id: '1',
  categories: [],
  preferredGenders: [],
  host: null,
  isHost: false,
  isParticipant: false,
  dateAndTime: '2026-01-14T18:54:56',
  title: 'Tech Conference 2024',
  description: 'A conference for tech enthusiasts.',
  picture: '',
  status: StatusEnum.upcoming,
  type: EventtypeEnum.public,
  isOnline: false,
  zipCode: '67890',
  city: 'Tech City',
  participantsNumber: 0,
  participants: [],
  maxParticipantsNumber: 100,
  startAge: null,
  endAge: null,
};

const mockAuthPayload: AuthTokenPayload = {
  userId: mockUser.id,
  username: mockUser.username,
  email: mockUser.email,
};

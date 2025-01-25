import { UtilsService } from './utils.service';
import { Test, TestingModule } from '@nestjs/testing';
import { EventDB } from '../database/EventDB';
import { GetEventCardDTO } from '../event/DTO/GetEventCardDTO';
import { UserDB } from '../database/UserDB';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mockEventRepository } from '../event/event.service.spec';
import { GetUserProfileDTO } from '../user/DTO/GetUserProfileDTO';
import { GetUserDataDTO } from '../user/DTO/GetUserDataDTO';
import { GetFriendProfileDTO } from '../user/DTO/GetFriendProfileDTO';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UtilsService,
        {
          provide: getRepositoryToken(EventDB),
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAge', () => {
    it('should be accepted', () => {
      const validDate = new Date('2002-02-18');
      const ret = service.validateUserAge(validDate, 18);
      expect(ret).toEqual(true);
    });

    it('should be accepted closely', () => {
      const validDate = new Date();
      validDate.setFullYear(validDate.getFullYear() - 18);
      validDate.setMinutes(validDate.getMinutes() - 1);

      const ret = service.validateUserAge(validDate, 18);
      expect(ret).toEqual(true);
    });

    it('should be denied', () => {
      const unvalid = new Date();
      unvalid.setFullYear(unvalid.getFullYear() - 18);

      const ret = service.validateUserAge(unvalid, 21);
      expect(ret).toEqual(false);
    });

    it('should be denied closely', () => {
      const unvalid = new Date();
      unvalid.setFullYear(unvalid.getFullYear() - 18);
      unvalid.setHours(unvalid.getHours() + 24);

      const ret = service.validateUserAge(unvalid, 18);
      expect(ret).toEqual(false);
    });

    it('should calculate the correct number of participants', async () => {
      const result: GetEventCardDTO =
        await service.transformEventDBtoGetEventCardDTO(mockEvent as EventDB);
      expect(result.participantsNumber).toEqual(3);
      expect(result.maxParticipantsNumber).toEqual(10);
    });

    describe('validateUserAge', () => {
      it('should return false for age below cutoff on the exact day', () => {
        const invalidDate = new Date();
        invalidDate.setFullYear(invalidDate.getFullYear() - 17);
        const result = service.validateUserAge(invalidDate, 18);
        expect(result).toEqual(false);
      });

      it('should return true for age at or above cutoff on the exact day', () => {
        const validDate = new Date();
        validDate.setFullYear(validDate.getFullYear() - 18);
        const result = service.validateUserAge(validDate, 18);
        expect(result).toEqual(true);
      });
    });

    describe('transformEventDBtoGetEventCardDTO', () => {
      it('should correctly transform EventDB to GetEventCardDTO', async () => {
        const result: GetEventCardDTO =
          await service.transformEventDBtoGetEventCardDTO(mockEvent as EventDB);
        expect(result).toBeDefined();
        expect(result.title).toEqual(mockEvent.title);
        expect(result.city).toEqual(mockEvent.city);
        expect(result.participantsNumber).toEqual(3);
        expect(result.maxParticipantsNumber).toEqual(
          mockEvent.participantsNumber,
        );
      });
    });

    describe('transformUserDBtoGetUserProfileDTO', () => {
      it('should transform a user to GetUserProfileDTO correctly', () => {
        const user = mockParticipants[0]; // Example user
        const result =
          mockUtilsService.transformUserDBtoGetUserProfileDTO(user);
        expect(result.firstName).toEqual(user.firstName);
        expect(result.username).toEqual(user.username);
        expect(result.profileText).toEqual(user.profileText);
      });

      it('should handle missing profileText gracefully', () => {
        const user = { ...mockParticipants[0], profileText: undefined };
        const result =
          mockUtilsService.transformUserDBtoGetUserProfileDTO(user);
        expect(result.profileText).toBeUndefined();
      });
    });

    describe('isHostOrParticipant', () => {
      it('should return true if the user is a host or participant', () => {
        const result = mockUtilsService.isHostOrParticipant(
          mockParticipants[0],
          mockEvent as EventDB,
        );
        expect(result).toEqual(true);
      });
    });

    describe('transformEventDBtoGetEventCardDTO', () => {
      it('should transform event with maxParticipantsNumber correctly', async () => {
        const mockEvent: Partial<EventDB> = {
          id: 'event2',
          categories: [],
          dateAndTime: new Date().toISOString(),
          title: 'Test Event',
          picture: 'test.jpg',
          status: 1,
          type: 2,
          isOnline: false,
          city: 'Test City',
          participants: mockParticipants,
          participantsNumber: 10,
        };
        const result: GetEventCardDTO =
          await service.transformEventDBtoGetEventCardDTO(mockEvent as EventDB);
        expect(result.maxParticipantsNumber).toEqual(10);
      });

      it('should handle events with no participants', async () => {
        const mockEvent: Partial<EventDB> = {
          id: 'event3',
          categories: [],
          dateAndTime: new Date().toISOString(),
          title: 'Empty Event',
          picture: 'empty.jpg',
          status: 1,
          type: 2,
          isOnline: false,
          city: 'Empty City',
          participants: [],
          participantsNumber: 0,
        };
        const result: GetEventCardDTO =
          await service.transformEventDBtoGetEventCardDTO(mockEvent as EventDB);
        expect(result.participantsNumber).toEqual(0);
      });
    });

    describe('isUserAllowedToJoinEvent', () => {
      it('should return true if the user is allowed to join the event', () => {
        const result = mockUtilsService.isUserAllowedToJoinEvent(
          mockParticipants[0],
          mockEvent as EventDB,
        );
        expect(result).toEqual(true);
      });
    });

    describe('transformSurveyDBtoGetSurveyDetailsDTO', () => {
      it('should transform survey with entries correctly', async () => {
        const mockSurvey = {
          id: 'survey1',
          title: 'Sample Survey',
          description: 'A test survey',
          creator: {
            id: 'creator-id',
            username: 'creator',
            profilePicture: 'profile.jpg',
            city: 'City',
            age: 30,
            firstName: 'Creator',
            isUser: false,
            profileText: 'Survey creator',
            pronouns: 'he/him',
          },
          surveyEntries: [
            {
              id: 'entry1',
              content: 'What is your favorite color?',
              answeredUsers: [],
            },
            {
              id: 'entry2',
              content: 'What is your favorite food?',
              answeredUsers: ['user-id'],
            },
          ],
        };

        const result =
          await mockUtilsService.transformSurveyDBtoGetSurveyDetailsDTO(
            mockSurvey,
            'user-id',
          );
        expect(result.surveyEntries.length).toBe(2);
        expect(result.surveyEntries[1].answered).toBe(true);
      });

      it('should handle survey with multiple answered entries', async () => {
        const mockSurvey = {
          id: 'survey3',
          title: 'Favorite Color Survey',
          description: 'What is your favorite color?',
          creator: {
            id: 'creator-id',
            username: 'creator',
            profilePicture: 'profile.jpg',
            city: 'City',
            age: 30,
            firstName: 'Creator',
            isUser: false,
            profileText: 'Survey creator',
            pronouns: 'he/him',
          },
          surveyEntries: [
            { id: 'entry1', content: 'Red', answeredUsers: ['user-id'] },
            { id: 'entry2', content: 'Blue', answeredUsers: ['user-id'] },
            { id: 'entry3', content: 'Green', answeredUsers: [] },
          ],
        };
        const result =
          await mockUtilsService.transformSurveyDBtoGetSurveyDetailsDTO(
            mockSurvey,
            'user-id',
          );
        expect(result.surveyEntries.length).toBe(3);
        expect(result.surveyEntries[0].answered).toBe(true);
        expect(result.surveyEntries[2].answered).toBe(false);
      });

      it('should handle empty survey entries gracefully', async () => {
        const mockSurvey = {
          id: 'survey1',
          title: 'Empty Survey',
          description: 'No entries',
          creator: {},
        };
        const result =
          await mockUtilsService.transformSurveyDBtoGetSurveyDetailsDTO(
            mockSurvey,
            'user-id',
          );
        expect(result.surveyEntries.length).toBe(0);
      });
    });

    describe('transformMessageDBtoChatMessageDTO', () => {
      it('should transform message with reactions correctly', () => {
        const mockMessage = {
          id: 'message1',
          text: 'Hello World',
          timestamp: new Date().toISOString(),
          writer: mockParticipants[0],
          reactions: [
            { userId: '1', type: 'like' },
            { userId: '2', type: 'love' },
          ],
        };

        const result = mockUtilsService.transformMessageDBtoChatMessageDTO(
          mockMessage,
          '1',
          '1',
        );
        expect(result.reactionsNumber).toEqual(2);
        expect(result.isHost).toEqual(true);
      });

      it('should transform message without reactions correctly', () => {
        const mockMessage = {
          id: 'message2',
          text: 'Another message',
          timestamp: new Date().toISOString(),
          writer: mockParticipants[1],
          reactions: [],
        };

        const result = mockUtilsService.transformMessageDBtoChatMessageDTO(
          mockMessage,
          '1',
          '1',
        );
        expect(result.reactionsNumber).toEqual(0);
        expect(result.isHost).toEqual(false);
      });
    });

    describe('transformUserDBtoGetUserDataDTO', () => {
      it('should transform user to GetUserDataDTO correctly', () => {
        const user = mockParticipants[0]; // Example user
        const result = mockUtilsService.transformUserDBtoGetUserDataDTO(user);
        expect(result.firstName).toEqual(user.firstName);
        expect(result.lastName).toEqual(user.lastName);
        expect(result.username).toEqual(user.username);
        expect(result.email).toEqual(user.email);
        expect(result.city).toEqual(user.city);
        expect(result.streetNumber).toEqual(user.streetNumber);
        expect(result.birthday).toEqual(user.birthday);
        expect(result.gender).toEqual(user.gender);
        expect(result.street).toEqual(user.street);
        expect(result.zipCode).toEqual(user.zipCode);
      });

      it('should handle missing fields gracefully', () => {
        const user = { ...mockParticipants[0], profileText: undefined };
        const result = mockUtilsService.transformUserDBtoGetUserDataDTO(user);
        expect(result.profileText).toBeUndefined();
      });
    });
    describe('transformListEntryDBtoGetListEntryDTO', () => {
      it('should transform list entry to GetListEntryDTO correctly', () => {
        const entry = { id: 'entry1', content: 'Sample list entry' };
        const result =
          mockUtilsService.transformListEntryDBtoGetListEntryDTO(entry);
        expect(result.id).toEqual(entry.id);
        expect(result.content).toEqual(entry.content);
      });
    });

    describe('transformListDBtoGetListDetailsDTO', () => {
      it('should transform list to GetListDetailsDTO correctly', () => {
        const mockList = {
          id: 'list1',
          title: 'Sample List',
          description: 'A test list',
          creator: mockParticipants[0],
          listEntries: [{ id: 'entry1', content: 'Test entry' }],
        };
        const result =
          mockUtilsService.transformListDBtoGetListDetailsDTO(mockList);
        expect(result.id).toEqual(mockList.id);
        expect(result.title).toEqual(mockList.title);
        expect(result.creator.firstName).toEqual(mockList.creator.firstName);
        expect(result.listEntries.length).toBe(1);
        expect(result.listEntries[0].content).toEqual(
          mockList.listEntries[0].content,
        );
      });

      it('should handle empty list entries gracefully', () => {
        const mockList = {
          id: 'list2',
          title: 'Empty List',
          description: '',
          creator: mockParticipants[1],
          listEntries: [],
        };
        const result =
          mockUtilsService.transformListDBtoGetListDetailsDTO(mockList);
        expect(result.listEntries.length).toBe(0);
      });
    });

    describe('transformEventChatToGetEventChatDTO', () => {
      it('should handle empty chat messages gracefully', () => {
        const mockMessages = [];
        const result = mockUtilsService.transformEventChatToGetEventChatDTO(
          mockMessages,
          '1',
          '1',
        );
        expect(result.readMessages.length).toBe(0);
        expect(result.unreadMessages.length).toBe(0);
      });
    });
  });

  const mockParticipants: UserDB[] = [
    {
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
      surveys: [],
      lists: [],
      tags: [],
      unreadMessages: [],
      viewEvents: [],
    },
    {
      id: '2',
      email: 'user2@example.com',
      username: 'user2',
      password: 'hashedpassword',
      firstName: 'User',
      lastName: 'Two',
      birthday: '1990-05-15',
      phoneNumber: '+1234567891',
      profilePicture: 'profile2.png',
      pronouns: 'they/them',
      profileText: 'Participant and coder.',
      streetNumber: '124',
      street: 'Side St',
      zipCode: '54321',
      city: 'Othertown',
      isVerified: true,
      gender: 1,
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
      surveys: [],
      lists: [],
      tags: [],
      unreadMessages: [],
      viewEvents: [],
    },
    {
      id: '3',
      email: 'user3@example.com',
      username: 'user3',
      password: 'hashedpassword',
      firstName: 'User',
      lastName: 'Three',
      birthday: '1995-03-20',
      phoneNumber: '+1234567892',
      profilePicture: 'profile3.png',
      pronouns: 'she/her',
      profileText: 'Participant and designer.',
      streetNumber: '125',
      street: 'Another St',
      zipCode: '67890',
      city: 'Yettown',
      isVerified: true,
      gender: 1,
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
      surveys: [],
      lists: [],
      tags: [],
      unreadMessages: [],
      viewEvents: [],
    },
  ];

  const mockEvent: Partial<EventDB> = {
    id: 'event1',
    categories: [],
    dateAndTime: new Date().toISOString(),
    title: 'Sample Event',
    picture: 'sample.jpg',
    status: 1,
    type: 2,
    isOnline: false,
    city: 'Sample City',
    participants: mockParticipants,
    participantsNumber: 10,
  };
});

export const mockUtilsService = {
  transformUserDBtoGetUserProfileDTO: jest.fn(
    (user): GetUserProfileDTO => ({
      id: user.id,
      isUser: false,
      firstName: user.firstName,
      username: user.username,
      city: user.city,
      profilePicture: user.profilePicture,
      pronouns: user.pronouns,
      age: 23,
      profileText: user.profileText,
    }),
  ),
  transformUserDBtoGetFriendProfileDTO: jest.fn(
    (user): GetFriendProfileDTO => ({
      id: user.id,
      isUser: false,
      areFriends: false,
      firstName: user.firstName,
      username: user.username,
      city: user.city,
      profilePicture: user.profilePicture,
      pronouns: user.pronouns,
      age: 23,
      profileText: user.profileText,
    }),
  ),

  transformUserDBtoGetUserDataDTO: jest.fn(
    (user): GetUserDataDTO => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      city: user.city,
      streetNumber: user.streetNumber,
      birthday: user.birthday,
      gender: user.gender,
      street: user.street,
      zipCode: user.zipCode,
    }),
  ),

  transformListEntryDBtoGetListEntryDTO: jest.fn((entry) => ({
    id: entry.id,
    content: entry.content,
  })),

  transformListDBtoGetListDetailsDTO: jest.fn((list) => ({
    id: list.id,
    title: list.title,
    description: list.description,
    creator: mockUtilsService.transformUserDBtoGetUserProfileDTO(list.creator),
    listEntries: list.listEntries.map((entry) =>
      mockUtilsService.transformListEntryDBtoGetListEntryDTO(entry),
    ),
  })),

  transformSurveyDBtoGetSurveyDetailsDTO: jest
    .fn()
    .mockImplementation(async (survey, currentUserId) => {
      const surveyEntries = (survey.surveyEntries || []).map((entry) => ({
        id: entry.id,
        content: entry.content,
        answered: entry.answeredUsers?.includes(currentUserId) ?? false,
      }));

      return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        creator: {
          id: survey.creator.id,
          username: survey.creator.username,
          profilePicture: survey.creator.profilePicture,
          city: survey.creator.city,
          age: survey.creator.age,
          firstName: survey.creator.firstName,
          isUser: survey.creator.isUser,
          profileText: survey.creator.profileText,
          pronouns: survey.creator.pronouns,
        },
        surveyEntries,
      };
    }),

  transformMessageDBtoChatMessageDTO: jest.fn(
    (message, currentUserId, hostId) => ({
      id: message.id,
      text: message.text,
      timestamp: message.timestamp,
      writer: message.writer
        ? mockUtilsService.transformUserDBtoGetUserProfileDTO(message.writer)
        : null,
      reactionsNumber: message.reactions?.length || 0,
      isHost: message.writer?.id === hostId,
    }),
  ),

  transformEventChatToGetEventChatDTO: jest.fn(
    (messages, currentUserId, hostId) => {
      const sortedMessages = messages.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      const readMessages = [];
      const unreadMessages = [];

      for (const message of sortedMessages) {
        const isUnread = message.unreadUsers?.some(
          (user) => user.id === currentUserId,
        );

        const transformedMessage =
          mockUtilsService.transformMessageDBtoChatMessageDTO(
            message,
            currentUserId,
            hostId,
          );

        if (isUnread) {
          unreadMessages.push(transformedMessage);
        } else {
          readMessages.push(transformedMessage);
        }
      }

      return {
        readMessages,
        unreadMessages,
      };
    },
  ),

  isHostOrParticipant: jest.fn(() => true),
  isUserAllowedToJoinEvent: jest.fn(() => true),
};

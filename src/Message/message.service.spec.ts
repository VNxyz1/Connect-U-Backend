import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageDB } from '../database/MessageDB';
import { EventDB } from '../database/EventDB';
import { UserDB } from '../database/UserDB';
import { NotFoundException } from '@nestjs/common';

describe('MessageService', () => {
  let service: MessageService;
  let messageRepository: jest.Mocked<Repository<MessageDB>>;
  let eventRepository: jest.Mocked<Repository<EventDB>>;
  let userRepository: jest.Mocked<Repository<UserDB>>;

  const mockEvent: EventDB = {
    id: 'event123',
    host: { id: 'user1', firstName: 'HostUser' } as UserDB,
    participants: [{ id: 'user2' }, { id: 'user3' }] as UserDB[],
    messages: [],
  } as EventDB;

  const mockUser: UserDB = { id: 'user2', unreadMessages: [] } as UserDB;

  const mockMessage: MessageDB = {
    id: 1,
    text: 'Hello, this is a test message',
    writer: mockUser,
    event: mockEvent,
    timestamp: new Date().toISOString(),
    unreadUsers: [mockEvent.host, ...mockEvent.participants],
  } as MessageDB;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getRepositoryToken(MessageDB),
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
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    messageRepository = module.get(getRepositoryToken(MessageDB));
    eventRepository = module.get(getRepositoryToken(EventDB));
    userRepository = module.get(getRepositoryToken(UserDB));
  });

  describe('createMessage', () => {
    it('should create and save a new message', async () => {
      eventRepository.findOne.mockResolvedValue(mockEvent);
      messageRepository.create.mockReturnValue(mockMessage);
      messageRepository.save.mockResolvedValue(mockMessage);

      const result = await service.createMessage(
        mockUser,
        'event123',
        'Test message',
      );

      expect(eventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event123' },
        relations: ['participants', 'host'],
      });

      expect(messageRepository.create).toHaveBeenCalled();

      expect(messageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Test message',
          writer: expect.objectContaining({ id: mockUser.id }),
          unreadUsers: expect.arrayContaining([
            expect.objectContaining({ id: mockEvent.host.id }),
            expect.objectContaining({ id: mockEvent.participants[1].id }),
          ]),
        }),
      );

      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createMessage(mockUser, 'event123', 'Test message'),
      ).rejects.toThrow(new NotFoundException('Event not found'));
    });
  });

  describe('getEventChat', () => {
    it('should return messages and hostId for an event', async () => {
      eventRepository.findOne.mockResolvedValue({
        ...mockEvent,
        messages: [mockMessage],
      });

      const result = await service.getEventChat('event123');

      expect(eventRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'event123' },
        relations: [
          'messages',
          'messages.writer',
          'messages.unreadUsers',
          'host',
          'participants',
        ],
      });
      expect(result).toEqual({
        messages: [mockMessage],
        hostId: mockEvent.host.id,
      });
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(service.getEventChat('event123')).rejects.toThrow(
        new NotFoundException('Event not found'),
      );
    });
  });

  describe('markMessagesAsRead', () => {
    it('should mark all unread messages in an event as read for a user', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        unreadMessages: [mockMessage],
      });

      const saveSpy = jest.spyOn(userRepository, 'save');

      await service.markMessagesAsRead('user2', 'event123');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user2' },
        relations: ['unreadMessages', 'unreadMessages.event'],
      });
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          unreadMessages: [],
        }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.markMessagesAsRead('user2', 'event123'),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });
  });
});

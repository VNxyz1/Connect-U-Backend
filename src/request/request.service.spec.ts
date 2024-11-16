import { EventtypeEnum } from '../database/enums/EventtypeEnum';
import { RequestService } from './request.service';
import { Repository } from 'typeorm';
import { RequestDB } from '../database/RequestDB';
import { EventDB } from '../database/EventDB';
import { UserDB } from '../database/UserDB';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('RequestService', () => {
  let service: RequestService;
  let requestRepository: jest.Mocked<Repository<RequestDB>>;
  let eventRepository: jest.Mocked<Repository<EventDB>>;
  let userRepository: jest.Mocked<Repository<UserDB>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestService,
        { provide: getRepositoryToken(RequestDB), useValue: jest.fn() },
        { provide: getRepositoryToken(EventDB), useValue: jest.fn() },
        { provide: getRepositoryToken(UserDB), useValue: jest.fn() },
      ],
    }).compile();

    service = module.get<RequestService>(RequestService);
    requestRepository = module.get(getRepositoryToken(RequestDB));
    eventRepository = module.get(getRepositoryToken(EventDB));
    userRepository = module.get(getRepositoryToken(UserDB));

    requestRepository.findOne = jest.fn();
    requestRepository.create = jest.fn();
    requestRepository.save = jest.fn();
    eventRepository.findOne = jest.fn();
    userRepository.findOne = jest.fn();
  });

  it('should throw NotFoundException if event is not found', async () => {
    eventRepository.findOne.mockResolvedValue(null);

    await expect(
      service.postJoinRequest('event123', 'user123'),
    ).rejects.toThrow(new NotFoundException('Event not found'));
  });

  it('should throw NotFoundException if user is not found', async () => {
    eventRepository.findOne.mockResolvedValue({
      id: 'event123',
      type: EventtypeEnum.halfPrivate,
      host: { id: 'host123' },
    } as EventDB);
    userRepository.findOne.mockResolvedValue(null);

    await expect(
      service.postJoinRequest('event123', 'user123'),
    ).rejects.toThrow(new NotFoundException('User not found'));
  });

  it('should throw an error if the host tries to send a join request to their own event', async () => {
    eventRepository.findOne.mockResolvedValue({
      id: 'event123',
      type: EventtypeEnum.halfPrivate,
      host: { id: 'user123' },
    } as EventDB);
    userRepository.findOne.mockResolvedValue({ id: 'user123' } as UserDB);

    await expect(
      service.postJoinRequest('event123', 'user123'),
    ).rejects.toThrow(
      new Error('Host cannot send a join request to their own event'),
    );
  });

  it('should throw an error if the event is not half-private', async () => {
    eventRepository.findOne.mockResolvedValue({
      id: 'event123',
      type: EventtypeEnum.public,
      host: { id: 'host123' },
    } as EventDB);
    userRepository.findOne.mockResolvedValue({ id: 'user123' } as UserDB);

    await expect(
      service.postJoinRequest('event123', 'user123'),
    ).rejects.toThrow(
      new Error('Join requests are only allowed for half-private events'),
    );
  });

  it('should throw an error if a request already exists', async () => {
    eventRepository.findOne.mockResolvedValue({
      id: 'event123',
      type: EventtypeEnum.halfPrivate,
      host: { id: 'host123' },
    } as EventDB);
    userRepository.findOne.mockResolvedValue({ id: 'user123' } as UserDB);
    requestRepository.findOne.mockResolvedValue({
      id: 1,
    } as RequestDB);

    await expect(
      service.postJoinRequest('event123', 'user123'),
    ).rejects.toThrow(new Error('Request already exists'));
  });

  it('should create and save a join request', async () => {
    const mockEvent = {
      id: 'event123',
      type: EventtypeEnum.halfPrivate,
      host: { id: 'host123' },
    } as EventDB;
    const mockUser = { id: 'user123' } as UserDB;
    const mockRequest = { id: 1 } as RequestDB;

    eventRepository.findOne.mockResolvedValue(mockEvent);
    userRepository.findOne.mockResolvedValue(mockUser);
    requestRepository.findOne.mockResolvedValue(null);
    requestRepository.create.mockReturnValue(mockRequest);
    requestRepository.save.mockResolvedValue(mockRequest);

    await service.postJoinRequest('event123', 'user123');

    expect(requestRepository.create).toHaveBeenCalledWith({
      user: mockUser,
      event: mockEvent,
      type: 1,
    });
    expect(requestRepository.save).toHaveBeenCalledWith(mockRequest);
  });
});

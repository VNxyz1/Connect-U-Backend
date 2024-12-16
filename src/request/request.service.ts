import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestDB } from '../database/RequestDB';
import { UserDB } from '../database/UserDB';
import { EventDB } from '../database/EventDB';
import { EventtypeEnum } from '../database/enums/EventtypeEnum';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(RequestDB)
    private readonly requestRepository: Repository<RequestDB>,
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
    @InjectRepository(UserDB)
    private readonly userRepository: Repository<UserDB>,
  ) {}

  /**
   * Creates a new request in the database.
   *
   * @param eventId - the ID of the event the user sends a request for
   * @param userId - the current user
   * @throws NotFoundException If the event or user does not exist.
   * @throws ForbiddenException If the user is the host of the event and is attempting to send a join request to their own event.
   * @throws BadRequestException If the event type is not `half-private` or if a request already exists.
   */
  async postJoinRequest(eventId: string, userId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId, type: EventtypeEnum.halfPrivate },
      relations: ['host'],
    });
    if (!event) throw new NotFoundException('Event not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (event.host.id === userId)
      throw new ForbiddenException(
        'Host cannot send a join request to their own event',
      );
    if (event.type !== 2)
      throw new BadRequestException(
        'Join requests are only allowed for half-private events',
      );

    const existingRequest = await this.requestRepository.findOne({
      where: { user: { id: userId }, event: { id: eventId } },
    });

    if (existingRequest) {
      if (existingRequest.denied) {
        existingRequest.denied = false;
        await this.requestRepository.save(existingRequest);
        return;
      } else {
        throw new BadRequestException('Request already exists');
      }
    }

    const request = this.requestRepository.create();
    request.user = user;
    request.event = event;
    request.type = 1;

    await this.requestRepository.save(request);
  }

  /**
   * Retrieves all requests sent by a specific user.
   *
   * @param userId - the ID of the user
   * @returns An array of requests sent by the user
   * @throws NotFoundException If the user does not exist.
   */
  async getRequestsByUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['requests', 'requests.event'],
    });
    if (!user) throw new NotFoundException('User not found');

    return user.requests.filter((request) => request.type === 1);
  }

  /**
   * Retrieves all requests for a specific event that have not been denied.
   *
   * @param eventId - the ID of the event
   * @param userId - currently logged-in user
   * @returns An array of requests for the event
   * @throws NotFoundException If the event does not exist.
   */
  async getRequestsForEvent(eventId: string, userId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['requests', 'requests.user', 'host'],
    });
    if (!event) throw new NotFoundException('Event not found');

    if (event.host.id !== userId) {
      throw new ForbiddenException(
        'You are not the host and cant view the events join requests',
      );
    }

    return event.requests.filter(
      (request) => request.type === 1 && !request.denied,
    );
  }

  /**
   * Accepts a join request, adds the user to the event's participant list, and deletes the request.
   *
   * @param requestId - the ID of the join request
   * @param userId - the ID of the host (currently logged-in user)
   * @throws NotFoundException If the request or event does not exist.
   * @throws ForbiddenException If the user is not the host of the event.
   * @throws BadRequestException If the event is already full or the request is already denied.
   */
  async acceptJoinRequest(requestId: number, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['event', 'user', 'event.host', 'event.participants'],
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const event = request.event;

    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.host.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to accept this request',
      );
    }

    if (request.denied) {
      throw new BadRequestException('This request has already been denied');
    }

    if (event.participants.length >= event.participantsNumber) {
      throw new BadRequestException(
        'The event has reached the maximum number of participants',
      );
    }

    event.participants.push(request.user);

    await this.eventRepository.save(event);

    await this.requestRepository.remove(request);
  }

  /**
   * Denies a request by setting its `denied` property to true.
   *
   * @param requestId - the ID of the request to be denied
   * @param userId - the ID of the currently logged-in user (event host)
   * @throws NotFoundException If the request or event does not exist.
   * @throws ForbiddenException If the logged-in user is not the host of the event.
   */
  async denyRequest(requestId: number, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['event', 'event.host'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const event = request.event;

    if (!event) {
      throw new NotFoundException(
        'Event associated with the request not found',
      );
    }

    if (event.host.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to deny this request',
      );
    }

    request.denied = true;

    await this.requestRepository.save(request);
  }

  /**
   * Deletes a join request sent by a user.
   *
   * @param requestId - the ID of the request to be deleted
   * @param userId - the ID of the currently logged-in user
   * @throws NotFoundException If the request does not exist.
   * @throws ForbiddenException If the request was not sent by the currently logged-in user.
   */
  async deleteJoinRequest(requestId: number, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['user'],
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.user.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this request',
      );
    }
    await this.requestRepository.remove(request);
  }

  /**
   * Deletes all requests associated with the given event ID.
   * @param eventId The ID of the event to delete requests for.
   */
  async deleteRequestsByEventId(eventId: string): Promise<void> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found.`);
    }

    await this.requestRepository.delete({ event });
  }
}

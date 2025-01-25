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
import { FriendService } from '../friend/friend.service';
import { RequestEnum } from '../database/enums/RequestEnum';

@Injectable()
export class RequestService {
  constructor(
    private readonly friendService: FriendService,
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
      relations: {
        event: {
          host: true,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.type === RequestEnum.joinRequest) {
        if (existingRequest.denied) {
          existingRequest.denied = false;
          return await this.requestRepository.save(existingRequest);
        } else {
          throw new BadRequestException('Request already exists');
        }
      } else if (existingRequest.type === RequestEnum.invite) {
        return await this.acceptInvitation(existingRequest.id, userId);
      }
    }

    const request = this.requestRepository.create();
    request.user = user;
    request.event = event;
    request.type = RequestEnum.joinRequest;

    return await this.requestRepository.save(request);
  }

  /**
   * Retrieves all requests sent by a specific user.
   *
   * @param userId - the ID of the user
   * @returns An array of requests sent by the user
   * @throws NotFoundException If the user does not exist.
   */
  async getJoinRequestsByUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['requests', 'requests.event'],
    });
    if (!user) throw new NotFoundException('User not found');

    return user.requests.filter(
      (request) => request.type === RequestEnum.joinRequest,
    );
  }

  /**
   * Retrieves all requests for a specific event that have not been denied.
   *
   * @param eventId - the ID of the event
   * @param userId - currently logged-in user
   * @returns An array of requests for the event
   * @throws NotFoundException If the event does not exist.
   */
  async getJoinRequestsForEvent(eventId: string, userId: string) {
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
      (request) => request.type === RequestEnum.joinRequest && !request.denied,
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

    return await this.requestRepository.remove(request);
  }

  /**
   * Denies a request by setting its `denied` property to true.
   *
   * @param requestId - the ID of the request to be denied
   * @param userId - the ID of the currently logged-in user (event host)
   * @throws NotFoundException If the request or event does not exist.
   * @throws ForbiddenException If the logged-in user is not the host of the event.
   */
  async denyJoinRequest(requestId: number, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['event', 'event.host', 'user'],
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
    return request;
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
      relations: ['event', 'user', 'event.host'],
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
    return request;
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

  /**
   * Creates an invitation for a user to join an event.
   *
   * @param eventId - the ID of the event the host is inviting the user to
   * @param user - the user being invited
   * @param hostId - the ID of the event host (currently logged-in user)
   * @throws NotFoundException If the event or user does not exist.
   * @throws ForbiddenException If the user is not the host of the event.
   * @throws BadRequestException If the user is already invited or is the host.
   */
  async createInvitation(eventId: string, user: UserDB, hostId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['host'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.host.id !== hostId) {
      throw new ForbiddenException('You are not the host of this event');
    }

    if (event.host.id === user.id) {
      throw new ForbiddenException(
        'You cannot invite yourself to your own event',
      );
    }

    const existingRequest = await this.requestRepository.findOne({
      where: {
        user: { id: user.id },
        event: { id: eventId },
        type: RequestEnum.invite,
      },
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

    if ((await this.friendService.areUsersFriends(hostId, user.id)) === false) {
      throw new BadRequestException('You can only invite friends');
    }

    const invite = this.requestRepository.create();
    invite.user = user;
    invite.event = event;
    invite.type = RequestEnum.invite;

    await this.requestRepository.save(invite);

    return { message: 'Invite successfully created', invite };
  }

  /**
   * Retrieves all invitations for a specific event that have not been denied.
   *
   * @param eventId - the ID of the event
   * @param userId - currently logged-in user
   * @returns An array of invitations for the event
   * @throws NotFoundException If the event does not exist.
   */
  async getInvitationsForEvent(eventId: string, userId: string) {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['requests', 'requests.user', 'host'],
    });
    if (!event) throw new NotFoundException('Event not found');

    if (event.host.id !== userId) {
      throw new ForbiddenException(
        'You are not the host and cant view the events invitations',
      );
    }

    return event.requests.filter(
      (request) => request.type === RequestEnum.invite,
    );
  }

  /**
   * Retrieves all invitations sent to a specific user.
   *
   * @param userId - the ID of the user
   * @returns An array of invitations
   * @throws NotFoundException If the user does not exist.
   */
  async getInvitationsByUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['requests', 'requests.event'],
    });
    if (!user) throw new NotFoundException('User not found');

    return user.requests.filter(
      (request) => request.type === RequestEnum.invite,
    );
  }

  /**
   * Deletes an invitation.
   *
   * @param requestId - the ID of the request to be deleted
   * @param userId - the ID of the currently logged-in user
   * @throws NotFoundException If the invitation does not exist.
   * @throws ForbiddenException If the invitation was not sent by the currently logged-in user.
   */
  async deleteInvitation(requestId: number, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['event', 'event.host', 'user'],
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.event.host.id !== userId) {
      throw new ForbiddenException(
        'You are not the host and cant delete invitations',
      );
    }
    return await this.requestRepository.remove(request);
  }

  /**
   * Accepts an invitation, adds the user to the event's participant list, and deletes the request.
   *
   * @param requestId - the ID of the invitation
   * @param userId - the ID of currently logged-in user
   * @throws NotFoundException If the request or event does not exist.
   * @throws ForbiddenException If the user is not the host of the event.
   * @throws BadRequestException If the event is already full or the request is already denied.
   */
  async acceptInvitation(requestId: number, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['event', 'user', 'event.participants', 'event.host'],
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const event = request.event;

    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (request.user.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to accept this request',
      );
    }

    if (event.participants.length >= event.participantsNumber) {
      throw new BadRequestException(
        'The event has reached the maximum number of participants',
      );
    }

    event.participants.push(request.user);

    await this.eventRepository.save(event);

    await this.requestRepository.remove(request);
    return request;
  }

  /**
   * Denies an invitation by setting its `denied` property to true.
   *
   * @param requestId - the ID of the invitation to be denied
   * @param userId - the ID of the currently logged-in user (event host)
   * @throws NotFoundException If the request or event does not exist.
   * @throws ForbiddenException If the logged-in user is not the user from the invitation.
   */
  async denyInvitation(requestId: number, userId: string) {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['event', 'user', 'event.host'],
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.user.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to deny this invitation',
      );
    }

    await this.requestRepository.remove(request);
    return request;
  }

  /**
   * Checks if a user has a pending request (join request or invitation) for a specific event.
   *
   * @param eventId - The ID of the event.
   * @param userId - The ID of the user.
   * @returns A boolean indicating if the user has a request for the event.
   * @throws NotFoundException If the event does not exist.
   */
  async hasUserRequestForEvent(
    eventId: string,
    userId: string,
  ): Promise<boolean> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const existingRequest = await this.requestRepository.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });

    return !!existingRequest;
  }
}

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
    if (existingRequest)
      throw new BadRequestException('Request already exists');

    const request = this.requestRepository.create();
    request.user = user;
    request.event = event;
    request.type = 1;

    await this.requestRepository.save(request);
  }
}

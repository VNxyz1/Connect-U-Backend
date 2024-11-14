import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestDB } from '../database/RequestDB';
import { UserDB } from '../database/UserDB';
import { EventDB } from '../database/EventDB';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(RequestDB)
    private requestRepository: Repository<RequestDB>,
    @InjectRepository(EventDB)
    private eventRepository: Repository<EventDB>,
    @InjectRepository(UserDB)
    private userRepository: Repository<UserDB>,
  ) {}

  async postJoinRequest(eventId: string, userId: string): Promise<RequestDB> {
    const event = await this.eventRepository.findOne({ where: { id: eventId }, relations: ['host']});
    if (!event) throw new NotFoundException('Event not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (event.host.id === userId) throw new Error('Host cannot send a join request to their own event');

    const existingRequest = await this.requestRepository.findOne({
      where: { user: { id: userId }, event: { id: eventId } },
    });
    if (existingRequest) throw new Error('Request already exists');

    const request = this.requestRepository.create();
    request.user = user;
    request.event = event;
    request.type = 1;
    return await this.requestRepository.save(request);
  }
}

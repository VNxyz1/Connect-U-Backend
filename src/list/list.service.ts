import {
  BadRequestException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListDB } from '../database/ListDB';
import { EventDB } from '../database/EventDB';

@Injectable()
export class ListService {
  constructor(
    @InjectRepository(ListDB)
    private readonly listRepository: Repository<ListDB>,
    private readonly eventRepository: Repository<EventDB>,
  ) {}


  /**
   * Creates a new list for an event.
   *
   * @param userId - The userId of the user attempting to create the list.
   * @param eventId - The ID of the event for which the list is being created.
   * @param title - The title of the list.
   * @param description - The description of the list (optional).
   * @returns {Promise<ListDB>} - The newly created list.
   *
   * @throws {NotFoundException} If the event does not exist.
   * @throws {BadRequestException} If the user is not a participant or the host of the event.
   */

  async createList(
    userId: string,
    eventId: string,
    title: string,
    description?: string,
  ): Promise<ListDB> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['participants', 'host'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isHost = event.host.id === userId;
    const isParticipant = event.participants.some((participant) => participant.id === userId);

    if (!isHost && !isParticipant) {
      throw new BadRequestException('You must be a participant or the host of the event to create a list');
    }

    // Create and save the new list
    const newList = this.listRepository.create({
      event,
      title,
      description,
    });

    return await this.listRepository.save(newList);
  }
}


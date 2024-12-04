import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListDB } from '../database/ListDB';
import { EventDB } from '../database/EventDB';
import { UserDB } from '../database/UserDB';

@Injectable()
export class ListService {
  constructor(
    @InjectRepository(ListDB)
    private readonly listRepository: Repository<ListDB>,
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
  ) {}

  /**
   * Creates a new list for an event.
   *
   * @param user - The user attempting to create the list.
   * @param eventId - The ID of the event for which the list is being created.
   * @param title - The title of the list.
   * @param description - The description of the list (optional).
   * @returns {Promise<ListDB>} - The newly created list.
   *
   * @throws {NotFoundException} If the event does not exist.
   */

  async createList(
    user: UserDB,
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

    const newList: ListDB = this.listRepository.create();
    newList.creator = user;
    newList.event = event;
    newList.title = title;
    newList.description = description;

    return await this.listRepository.save(newList);
  }

  /**
   * Retrieves a list by its ID.
   *
   * @param listId - The ID of the list to retrieve.
   * @returns The list with the specified ID.
   * @throws NotFoundException - If the list does not exist.
   */
  async getListById(listId: number): Promise<ListDB> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: ['event', 'creator', 'listEntries'],
    });

    if (!list) {
      throw new NotFoundException('List not found');
    }

    return list;
  }
}

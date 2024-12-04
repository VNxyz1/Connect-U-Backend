import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListEntryDB } from '../database/ListEntryDB';
import { ListDB } from '../database/ListDB';
import { UserDB } from '../database/UserDB';

@Injectable()
export class ListEntryService {
  constructor(
    @InjectRepository(ListEntryDB)
    private readonly listEntryRepository: Repository<ListEntryDB>,
    @InjectRepository(ListDB)
    private readonly listRepository: Repository<ListDB>,
  ) {}

  /**
   * Creates a new list entry.
   *
   * @param listId - ID of the associated list.
   * @param content - The content of the list entry.
   * @returns The newly created list entry.
   * @throws NotFoundException If the list does not exist.
   */
  async createListEntry(listId: number, content: string): Promise<ListEntryDB> {
    const list = await this.listRepository.findOne({ where: { id: listId } });

    if (!list) {
      throw new NotFoundException('List with ID not found');
    }

    const newListEntry = this.listEntryRepository.create();

    newListEntry.list = list;
    newListEntry.content = content;

    return await this.listEntryRepository.save(newListEntry);
  }

  /**
   * Retrieves a list by its ID.
   *
   * @returns The list with the specified ID.
   * @throws NotFoundException - If the list does not exist.
   * @param listEntryId - the id of the list entry
   */
  async getListEntryById(listEntryId: number): Promise<ListEntryDB> {
    const listEntry = await this.listEntryRepository.findOne({
      where: { id: listEntryId },
      relations: ['list','list.event','user'],
    });

    if (!listEntry) {
      throw new NotFoundException('List Entry not found');
    }

    return listEntry;
  }

  /**
   * Updates a list entry to add the logged-in user.
   *
   * @param listEntry - list entry to update.
   * @param user - The logged-in user to be added.
   * @returns The updated list entry.
   * @throws NotFoundException If the list entry does not exist.
   */
  async updateListEntry(
    listEntry: ListEntryDB,
    user: UserDB,
  ): Promise<ListEntryDB> {

    listEntry.user = user;

    return await this.listEntryRepository.save(listEntry);
  }

  /**
   * Removes the user from a list entry.
   *
   * @param listEntry - The list entry to update.
   * @returns The updated list entry with the user removed.
   * @throws NotFoundException If the list entry does not exist.
   * @throws BadRequestException If there is no user assigned to the list entry.
   */
  async removeUserFromListEntry(listEntry: ListEntryDB): Promise<ListEntryDB> {

    listEntry.user = null;

    return await this.listEntryRepository.save(listEntry);
  }
}

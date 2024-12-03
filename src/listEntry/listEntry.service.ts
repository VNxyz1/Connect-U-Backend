import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListEntryDB } from '../database/ListEntryDB';
import { ListDB } from '../database/ListDB';

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
}

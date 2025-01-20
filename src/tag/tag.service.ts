import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { TagDB } from '../database/TagDB';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(TagDB)
    private readonly tagRepository: Repository<TagDB>,
  ) {}

  async findOrCreateTags(tags: string[]): Promise<TagDB[]> {
    const uniqueTags = Array.from(new Set(tags));
    const resultTags: TagDB[] = [];

    for (const tag of uniqueTags) {
      let existingTag = await this.tagRepository.findOne({
        where: { title: tag },
      });

      if (!existingTag) {
        existingTag = this.tagRepository.create({ title: tag });
        await this.tagRepository.save(existingTag);
      }

      resultTags.push(existingTag);
    }
    return resultTags;
  }

  async getAllTags(tagSearch: string): Promise<TagDB[]> {
    const tags = await this.tagRepository.find({
      where: {
        title: Like(`%${tagSearch.toLowerCase()}%`),
      },
      relations: ['events', 'users'],
    });

    return tags.sort((a, b) => {
      const countA = a.events.length + a.users.length;
      const countB = b.events.length + b.users.length;
      return countB - countA;
    });
  }
}

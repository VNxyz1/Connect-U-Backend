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
    return this.tagRepository.find({
      where: {
        title: Like(`%${tagSearch.toLowerCase()}%`),
      },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagDB } from '../database/TagDB';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(TagDB)
    private readonly tagRepository: Repository<TagDB>,
  ) {}

  async findOrCreateTags(tags: string[]): Promise<TagDB[]> {
    const resultTags: TagDB[] = [];

    for (const tag of tags) {
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
}

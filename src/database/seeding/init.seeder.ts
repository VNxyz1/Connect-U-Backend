import { InjectRepository } from '@nestjs/typeorm';
import { EventDB } from '../EventDB';
import { Repository } from 'typeorm';
import { userFactory } from './user.factory';
import { UserDB } from '../UserDB';
import { eventFactory } from './event.factory';
import { CategoryDB } from '../CategoryDB';
import { TagService } from '../../tag/tag.service';
import { fakerDE as faker } from '@faker-js/faker';

export class InitSeeder {
  constructor(
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
    @InjectRepository(UserDB)
    private readonly userRepository: Repository<UserDB>,
    @InjectRepository(CategoryDB)
    private readonly categoryRepository: Repository<CategoryDB>,
    private readonly tagService: TagService,
  ) {}

  async onApplicationBootstrap() {
    const populate = Boolean(process.env.POPULATE_DB) || false;

    if (populate) {
      await this.initUsers();
      const users = await this.userRepository.find({});
      const categories = await this.categoryRepository.find({});

      await this.initEvents(users, categories);
    }
  }

  private async initUsers() {
    const users = [];

    for (let i = 0; i < 150; i++) {
      users.push(userFactory());
    }

    return this.userRepository.save(users);
  }

  private async initEvents(userList: UserDB[], categorys: CategoryDB[]) {
    const events = [];

    for (let i = 0; i < 80; i++) {
      const tags = await this.tagService.findOrCreateTags(
        faker.word.words({ count: { min: 2, max: 5 } }).split(' '),
      );
      events.push(await eventFactory(userList, categorys, tags));
    }

    return this.eventRepository.save(events);
  }
}

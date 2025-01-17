import { InjectRepository } from '@nestjs/typeorm';
import { EventDB } from '../EventDB';
import { Repository } from 'typeorm';
import { userFactory } from './user.factory';
import { UserDB } from '../UserDB';
import { eventFactory } from './event.factory';
import { CategoryDB } from '../CategoryDB';
import { TagService } from '../../tag/tag.service';
import { fakerDE as faker } from '@faker-js/faker';
import ViewedEventsDB from '../ViewedEventsDB';
import ViewEventEnum from '../enums/ViewEventEnum';
import { FriendService } from '../../friend/friend.service';
import { OnApplicationBootstrap } from '@nestjs/common';

const testUser = new UserDB();
testUser.username = 'testUser';
testUser.email = 'test@gmail.com';
testUser.password = 'Passwort1234';
testUser.firstName = 'firstName';
testUser.lastName = 'lastName';
testUser.birthday = '2002-08-06';
testUser.gender = 2;
testUser.profilePicture = 'empty.png';

export class InitSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
    @InjectRepository(UserDB)
    private readonly userRepository: Repository<UserDB>,
    @InjectRepository(CategoryDB)
    private readonly categoryRepository: Repository<CategoryDB>,
    @InjectRepository(ViewedEventsDB)
    private readonly veRepository: Repository<ViewedEventsDB>,
    private readonly tagService: TagService,
    private readonly friendService: FriendService,
  ) {}

  async onApplicationBootstrap() {
    const populate = JSON.parse(process.env.POPULATE_DB) || false;
    if (populate) {
      const userCount = await this.userRepository.count();
      const desiredUsers = Number(process.env.DESIRED_USERS) || 50;
      const addUsers = userCount < desiredUsers;

      if (addUsers) {
        await this.initUsers(desiredUsers - userCount);
      }

      const eventCount = await this.eventRepository.count();
      const desiredEvents = Number(process.env.DESIRED_EVENTS) || 20;
      const addEvents = eventCount < desiredEvents;
      if (addEvents) {
        const users = await this.userRepository.find({});
        const categories = await this.categoryRepository.find({});
        await this.initEvents(users, categories, desiredEvents - eventCount);
      }
    }
  }

  private async initUsers(count: number) {
    const users: UserDB[] = [];

    users.push(testUser);

    for (let i = 1; i < count; i++) {
      users.push(userFactory());
    }

    const userList = await this.userRepository.save<UserDB>(users);
    await this.initFriends(userList);
  }

  private async initEvents(
    userList: UserDB[],
    categorys: CategoryDB[],
    count: number,
  ) {
    const events = [];

    for (let i = 0; i < count; i++) {
      const tags = await this.tagService.findOrCreateTags(
        faker.word.words({ count: { min: 2, max: 5 } }).split(' '),
      );
      events.push(await eventFactory(userList, categorys, tags));
    }

    await this.eventRepository.save(events);

    await this.initClicks(events, userList);
  }

  private async initClicks(events: EventDB[], userList: UserDB[]) {
    for (const event of events) {
      const viewedEvents: ViewedEventsDB[] = [];
      for (
        let i = 0;
        i <
        faker.number.int({
          min: 0,
          max: faker.number.int({ min: 0, max: userList.length - 1 }),
        });
        i++
      ) {
        const user =
          userList[faker.number.int({ min: 0, max: userList.length - 1 })];
        if (viewedEvents.find((ve) => ve.user.id === user.id)) {
          continue;
        }
        const viewedEvent: ViewedEventsDB = new ViewedEventsDB();
        viewedEvent.user = user;
        viewedEvent.event = event;
        viewedEvent.viewed = faker.datatype.boolean({ probability: 0.75 })
          ? ViewEventEnum.CLICKED_ON
          : ViewEventEnum.VIEWED;
        await this.veRepository.save(viewedEvent);
      }
    }
  }

  private async initFriends(userList: UserDB[]) {
    for (const user of userList) {
      for (
        let i = 0;
        i <
        faker.number.int({
          min: 0,
          max: faker.number.int({ min: 0, max: userList.length - 1 }),
        });
        i++
      ) {
        try {
          await this.friendService.createFriend(
            user,
            userList[faker.number.int({ min: 0, max: userList.length - 1 })]
              .username,
          );
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const e = error;
        }
      }
    }
  }
}

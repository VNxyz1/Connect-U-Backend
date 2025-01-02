import { fakerDE as faker } from '@faker-js/faker';
import { EventDB } from '../EventDB';
import { UserDB } from '../UserDB';
import { CategoryDB } from '../CategoryDB';
import { TagDB } from '../TagDB';

export const eventFactory = async (
  userList: UserDB[],
  categorys: CategoryDB[],
  tags: TagDB[],
) => {
  const event = new EventDB();

  event.host = userList[faker.number.int({ min: 0, max: userList.length - 1 })];
  event.city = faker.location.city();
  event.zipCode = faker.location.zipCode();
  event.street = faker.location.street();
  event.streetNumber = faker.location.buildingNumber();
  event.dateAndTime = faker.date.soon({ days: 50 }).toISOString();
  let catCount = 0;
  event.categories = categorys.filter(() => {
    return faker.datatype.boolean() && catCount++ < 3;
  });

  event.participantsNumber = faker.number.int({ min: 0, max: 30 });
  let count = 0;
  event.participants = userList.filter((user) => {
    if (count >= event.participantsNumber) {
      return false;
    }
    count++;
    return user !== event.host && faker.datatype.boolean();
  });

  event.description = faker.lorem.paragraph();
  event.timestamp = faker.date.recent({ days: 50 }).toISOString();
  event.type = faker.number.int({ min: 1, max: 3 });
  event.title = faker.word.words({ count: { min: 2, max: 5 } });

  event.tags = tags;

  return event;
};

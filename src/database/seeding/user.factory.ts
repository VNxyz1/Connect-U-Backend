import { UserDB } from '../UserDB';
import { fakerDE as faker } from '@faker-js/faker';

export const userFactory = () => {
  const user = new UserDB();

  const sex = faker.person.sexType();

  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName();

  user.email = faker.internet.email({ firstName, lastName });
  user.firstName = firstName;
  user.lastName = lastName;
  user.birthday = faker.date.birthdate().toISOString();
  user.gender = faker.number.int({ min: 0, max: 3 });
  user.profileText = faker.person.bio();
  user.profilePicture = faker.image.avatar();
  user.city = faker.location.city();
  user.zipCode = faker.location.zipCode();
  user.password = faker.internet.password();
  user.username = faker.internet.username({ firstName, lastName });
  user.profilePicture = 'empty.png';

  return user;
};

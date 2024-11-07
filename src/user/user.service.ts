import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDB } from '../database/UserDB';
import * as bcrypt from 'bcryptjs';
import { CreateUserDTO } from './DTO/CreateUserDTO';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserDB)
    private userRepository: Repository<UserDB>,
  ) {}

  async createUser(body: CreateUserDTO): Promise<UserDB> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findOne({ where: { email: body.email } }),
      this.userRepository.findOne({ where: { username: body.username } }),
    ]);

    if (existingEmail) {
      throw new BadRequestException('e-mail address is already taken');
    }
    if (existingUsername) {
      throw new BadRequestException('username is already taken');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser: UserDB = this.userRepository.create();
    newUser.firstName = body.firstName;
    newUser.lastName = body.lastName;
    newUser.email = body.email;
    newUser.username = body.username;
    newUser.password = hashedPassword;
    newUser.birthday = body.birthday;
    newUser.gender = body.gender;
    return await this.userRepository.save(newUser);
  }
}

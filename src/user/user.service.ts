import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDB } from '../database/UserDB';
import * as bcrypt from 'bcryptjs';
import { CreateUserDTO } from './DTO/CreateUserDTO';
import { UpdateUserDataDTO } from './DTO/UpdateUserDataDTO';
import { UpdateProfileDTO } from './DTO/UpdateProfileDTO';
import { TagDB } from '../database/TagDB';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserDB)
    private readonly userRepository: Repository<UserDB>,
  ) {}

  /**
   * Creates a new user in the database.
   *
   * @param {CreateUserDTO} body - Data transfer object containing user information.
   * @returns {Promise<UserDB>} - The newly created user.
   * @throws {BadRequestException} - If the email or username is already taken.
   */
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

    const newUser: UserDB = this.userRepository.create();
    newUser.firstName = body.firstName;
    newUser.lastName = body.lastName;
    newUser.email = body.email;
    newUser.username = body.username;
    newUser.password = body.password;
    newUser.birthday = body.birthday;
    newUser.gender = body.gender['value'] ? body.gender['value'] : body.gender;
    return await this.userRepository.save(newUser);
  }

  /**
   * Finds a user by their email address.
   *
   * @param {string} email - The email address to search for.
   * @returns {Promise<UserDB>} - The user with the specified email.
   * @throws {NotFoundException} - If no user with the given email is found.
   */
  async findByEmail(email: string): Promise<UserDB> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (user === null) {
      throw new NotFoundException(
        `The user with the email \"${email}\" does not exist`,
      );
    }

    return user;
  }

  /**
   * Finds a user by their username.
   *
   * @param {string} username - The username to search for.
   * @returns {Promise<UserDB>} - The user with the specified username.
   * @throws {NotFoundException} - If no user with the given username is found.
   */
  async findByUsername(username: string): Promise<UserDB> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: {
        tags: true,
      },
    });
    if (user === null) {
      throw new NotFoundException(
        `The user with the username \"${username}\" does not exist`,
      );
    }

    return user;
  }

  /**
   * Finds a user by their unique ID.
   *
   * @param {string} id - The unique ID of the user to find.
   * @returns {Promise<UserDB>} - The user with the specified ID.
   * @throws {NotFoundException} - If no user with the given ID is found.
   */
  async findById(id: string): Promise<UserDB> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        surveyEntries: true,
        tags: true,
      },
    });

    if (user === null) {
      throw new NotFoundException(
        `The user with the id \"${id}\" does not exist`,
      );
    }

    return user;
  }

  /**
   * Updates a user's information.
   *
   * @param {string} id - The unique ID of the user to update.
   * @param {Partial<UpdateUserDataDTO>} updateData - Partial DTO with fields to update.
   * @returns {Promise<UserDB>} - The updated user.
   * @throws {BadRequestException} - If the email or username is already taken (if being updated).
   */
  async updateUser(
    id: string,
    updateData: Partial<UpdateUserDataDTO>,
  ): Promise<UserDB> {
    const user = await this.findById(id);

    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingEmail) {
        throw new BadRequestException('e-mail address is already taken');
      }
    }

    if (updateData.username && updateData.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: updateData.username },
      });
      if (existingUsername) {
        throw new BadRequestException('username is already taken');
      }
    }
    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  /**
   * Updates a user's profile.
   *
   * @param {string} id - The unique ID of the user to update.
   * @param tags - tags for the user
   * @param {Partial<UpdateProfileDTO>} updateData - Partial DTO with fields to update.
   * @returns {Promise<UserDB>} - The updated user.
   */
  async updateUserProfile(
    id: string,
    tags: TagDB[] | null,
    updateData: Partial<UpdateProfileDTO>,
  ): Promise<UserDB> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.pronouns = updateData.pronouns?.trim() || null;
    user.profileText = updateData.profileText?.trim() || null;

    if (tags === null) {
      user.tags = [];
    } else {
      user.tags = tags;
    }

    return await this.userRepository.save(user);
  }

  /**
   * Updates a user's password.
   *
   * @param {string} id - The unique ID of the user to update.
   * @param {string} password - password to update.
   * @returns {Promise<UserDB>} - The updated user.
   */
  async updatePassword(id: string, password: string): Promise<UserDB> {
    const user = await this.findById(id);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    return await this.userRepository.save(user);
  }

  /**
   * Updates a user's password.
   *
   * @param {string} id - The unique ID of the user to update.
   * @param profilePic - new profile picture path
   * @returns {Promise<UserDB>} - The updated user.
   */
  async updateProfilePic(id: string, profilePic: string): Promise<UserDB> {
    const user = await this.findById(id);

    user.profilePicture = profilePic;

    return await this.userRepository.save(user);
  }
}

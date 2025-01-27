import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDB } from '../database/UserDB';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(UserDB)
    private readonly userRepository: Repository<UserDB>,
  ) {}

  private readonly activeInviteLinkUUIDs = new Map<
    string,
    { value: string; timeout: NodeJS.Timeout }
  >();

  /**
   * Creates an invitation link for adding a friend.
   * @param protocol The protocol to use (e.g., 'http' or 'https').
   * @param host The host or domain name of the server.
   * @param username The username of the user creating the invite link.
   * @param uuid A unique identifier for the invite link.
   * @returns A formatted invite link as a string.
   */
  createInviteLink(
    protocol: string,
    host: string,
    username: string,
    uuid: string,
  ): string {
    return `${protocol}://${host}/add-friend/${username}/${uuid}`;
  }

  /**
   * Sets an active invite link for a user with a specified time-to-live (TTL).
   * @param key The username associated with the invite link.
   * @param uuid The unique identifier for the invite link.
   * @param ttl The time-to-live for the invite link in milliseconds. Defaults to 5 minutes (300000 ms).
   */
  setInviteLink(key: string, uuid: string, ttl: number = 5 * 60 * 1000): void {
    if (this.activeInviteLinkUUIDs.has(key)) {
      clearTimeout(this.activeInviteLinkUUIDs.get(key).timeout);
    }

    const timeout = setTimeout(() => {
      this.activeInviteLinkUUIDs.delete(key);
    }, ttl);

    this.activeInviteLinkUUIDs.set(key, { value: uuid, timeout });
  }

  /**
   * Retrieves the UUID of an active invite link for a user.
   * @param key The username associated with the invite link.
   * @returns The UUID of the active invite link, or undefined if no active link exists.
   */
  getActiveUUID(key: string): string | undefined {
    const entry = this.activeInviteLinkUUIDs.get(key);
    return entry ? entry.value : undefined;
  }

  /**
   * Checks if there is an active invite link for a user.
   * @param key The username associated with the invite link.
   * @returns True if an active invite link exists, otherwise false.
   */
  hasActiveUUID(key: string): boolean {
    return this.activeInviteLinkUUIDs.has(key);
  }

  /**
   * Creates a friendship between two users.
   * @param currentUser The user who is initiating the friend request.
   * @param username the username of the user to be added as a friend.
   * @returns The updated user with the new friend added.
   * @throws NotFoundException if the friend with the given ID is not found.
   * @throws Error if the friend already exists in the user's friend list or friendOf list.
   * @throws Error if the User trys to befriend thyself
   */
  async createFriend(currentUser: UserDB, username: string): Promise<UserDB> {
    const friend = await this.userRepository.findOne({
      where: { username: username },
      relations: ['friendOf'],
    });
    const user = await this.userRepository.findOne({
      where: { username: currentUser.username },
      relations: ['friends', 'friendOf'],
    });

    if (!friend) {
      throw new NotFoundException('Friend not found');
    }

    if (user.username == username) {
      throw new Error('User cannot befriend thyself');
    }

    const existingFriend = user.friends.find((f) => f.id === friend.id);
    if (existingFriend) {
      throw new Error('Friend already exists in the users friend list');
    }
    const existingFriendOf = user.friendOf.find((f) => f.id === friend.id);
    if (existingFriendOf) {
      throw new Error('Friend already exists in the users friendOf list');
    }

    user.friends.push(friend);
    friend.friendOf = friend.friendOf || [];
    friend.friendOf.push(user);

    await this.userRepository.save(user);
    await this.userRepository.save(friend);

    return user;
  }

  /**
   * Retrieves all friends of a given user.
   * @param userId The ID of the user whose friends should be retrieved.
   * @returns An array of friends.
   */
  async getFriends(userId: string): Promise<UserDB[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['friends', 'friendOf'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const allFriends = [...user.friends, ...user.friendOf];

    return Array.from(
      new Map(allFriends.map((friend) => [friend.id, friend])).values(),
    );
  }

  /**
   * Checks if two users are friends.
   * @param userId1 The ID of the first user.
   * @param userId2 The ID of the second user.
   * @returns True if the users are friends, otherwise false.
   * @throws NotFoundException if either user is not found.
   */
  async areUsersFriends(userId1: string, userId2: string): Promise<boolean> {
    const user1 = await this.userRepository.findOne({
      where: { id: userId1 },
      relations: ['friends', 'friendOf'],
    });

    const user2 = await this.userRepository.findOne({
      where: { id: userId2 },
      relations: ['friends', 'friendOf'],
    });

    if (!user1) {
      throw new NotFoundException('User 1 not found');
    }

    if (!user2) {
      throw new NotFoundException('User 2 not found');
    }

    return (
      user1.friends.some((friend) => friend.id === user2.id) ||
      user2.friends.some((friend) => friend.id === user1.id)
    );
  }
}

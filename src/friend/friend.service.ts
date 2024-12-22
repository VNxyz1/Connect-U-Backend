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

  createInviteLink(
    protocol: string,
    host: string,
    username: string,
    uuid: string,
  ): string {
    return `${protocol}://${host}/add-friend/${username}/${uuid}`;
  }

  /**
   *
   * @param key a username
   * @param uuid the uuid of the active link
   * @param ttl the `time to live` for the invite link. Defaults to 5 minutes `(5 * 60 * 1000)`
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
   *
   * @param key a username
   * @return the uuid of the active link if there is one available
   */
  getActiveUUID(key: string): string | undefined {
    const entry = this.activeInviteLinkUUIDs.get(key);
    return entry ? entry.value : undefined;
  }

  /**
   *
   * @param key a username
   */
  hasActiveUUID(key: string): boolean {
    return this.activeInviteLinkUUIDs.has(key);
  }

  async createFriend(user: UserDB, friendId: string): Promise<UserDB> {
    const friend = await this.userRepository.findOne({
      where: { id: friendId },
      relations: ['friendOf'],
    });

    if (!friend) {
      throw new NotFoundException('Friend not found');
    }

    const existingFriend = (await user.friends).find((f) => f.id === friendId);
    if (existingFriend) {
      throw new Error('Friend already exists in the user\'s friend list');
    }

    (await user.friends).push(friend);

    (await friend.friendOf).push(user);

    await this.userRepository.save(user);
    await this.userRepository.save(friend);

    return user;
  }

}

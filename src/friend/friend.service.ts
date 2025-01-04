import { Injectable } from '@nestjs/common';

@Injectable()
export class FriendService {
  private activeInviteLinkUUIDs = new Map<
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
}

import { Injectable } from '@nestjs/common';
import { In, Not, Repository } from 'typeorm';
import { MessageDB } from '../database/MessageDB';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusEnum } from '../database/enums/StatusEnum';

@Injectable()
export class PushNotificationService {
  constructor(
    @InjectRepository(MessageDB)
    private readonly messageRepository: Repository<MessageDB>,
  ) {}

  async getUnreadMessagesMap(userId: string) {
    const messages = await this.messageRepository.find({
      where: {
        event: {
          status: Not(In([StatusEnum.finished, StatusEnum.cancelled])),
        },
        unreadUsers: {
          id: userId,
        },
      },
      select: {
        event: {
          id: true,
        },
      },
      relations: {
        event: true,
      },
    });

    const convMap: Record<string, number> = {};
    messages.forEach((message) => {
      const currentValue = convMap[message.event.id] || 0;
      convMap[message.event.id] = currentValue + 1;
    });
    return convMap;
  }
}

import { Injectable } from '@nestjs/common';
import { In, Not, Repository } from 'typeorm';
import { MessageDB } from '../database/MessageDB';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusEnum } from '../database/enums/StatusEnum';
import { RequestDB } from '../database/RequestDB';
import {RequestEnum} from '../database/enums/RequestEnum';

@Injectable()
export class PushNotificationService {
  constructor(
    @InjectRepository(MessageDB)
    private readonly messageRepository: Repository<MessageDB>,
    @InjectRepository(RequestDB)
    private readonly requestRepository: Repository<RequestDB>,
  ) {}

  async getUnreadMessagesMapHost(userId: string) {
    const messages = await this.messageRepository.find({
      where: {
        event: {
          status: Not(In([StatusEnum.finished, StatusEnum.cancelled])),
          host: {
            id: userId,
          },
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

    return this.transformToRecord(messages);
  }

  async getUnreadMessagesMapParticipant(userId: string) {
    const messages = await this.messageRepository.find({
      where: {
        event: {
          status: Not(In([StatusEnum.finished, StatusEnum.cancelled])),
          participants: {
            id: userId,
          },
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

    return this.transformToRecord(messages);
  }

  async getJoinRequestsOfHost(userId: string) {
    const requests = await this.requestRepository.find({
      where: {
        event: {
          host: {
            id: userId,
          },
          status: Not(In([StatusEnum.finished, StatusEnum.cancelled])),
        },
        denied: false,
        type: RequestEnum.joinRequest,
      },
      relations: {
        event: true,
      },
    });

    const convMap: Record<string, number> = {};
    requests.forEach((req) => {
      const currentValue = convMap[req.event.id] || 0;
      convMap[req.event.id] = currentValue + 1;
    });
    return convMap;
  }

  private transformToRecord(messages: MessageDB[]) {
    const convMap: Record<string, number> = {};
    messages.forEach((message) => {
      const currentValue = convMap[message.event.id] || 0;
      convMap[message.event.id] = currentValue + 1;
    });
    return convMap;
  }
}

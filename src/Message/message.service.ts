import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageDB } from '../database/MessageDB';
import { EventDB } from '../database/EventDB';
import { UserDB } from '../database/UserDB';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageDB)
    private readonly messageRepository: Repository<MessageDB>,
    @InjectRepository(EventDB)
    private readonly eventRepository: Repository<EventDB>,
  ) {}

  /**
   * Posts a new message in the event chat.
   *
   * @param user - The user posting the message (nullable for system messages).
   * @param eventId - The ID of the event to which the message belongs.
   * @param text - The content of the message.
   * @returns {Promise<MessageDB>} - The newly created message.
   *
   * @throws {NotFoundException} If the event does not exist.
   */
  async createMessage(
    user: UserDB | null,
    eventId: string,
    text: string,
  ): Promise<MessageDB> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['participants', 'host'],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const allUsers = [event.host, ...event.participants];
    const unreadUsers = user
      ? allUsers.filter((participant) => participant.id !== user.id)
      : allUsers;

    const newMessage: MessageDB = this.messageRepository.create({
      event,
      writer: user,
      text,
      unreadUsers,
    });

    return await this.messageRepository.save(newMessage);
  }
}

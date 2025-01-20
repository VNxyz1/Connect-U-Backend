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
    @InjectRepository(UserDB)
    private readonly userRepository: Repository<UserDB>,
  ) {}

  /**
   * Posts a new message in the event chat.
   *
   * @param user - The user posting the message (nullable for system messages).
   * @param eventId - The ID of the event to which the message belongs.
   * @param content
   * @returns {Promise<MessageDB>} - The newly created message.
   *
   * @throws {NotFoundException} If the event does not exist.
   */
  async createMessage(
    user: UserDB | null,
    eventId: string,
    content: string | { key: string; params: Record<string, string> },
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

    const newMessage: MessageDB = this.messageRepository.create();
    newMessage.event = event;

    if (typeof content === 'object') {
      newMessage.text = JSON.stringify(content);
    } else {
      newMessage.text = content;
    }

    newMessage.writer = user;
    newMessage.unreadUsers = unreadUsers;

    return await this.messageRepository.save(newMessage);
  }

  async getEventChat(
    eventId: string,
  ): Promise<{ messages: MessageDB[]; hostId: string }> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: [
        'messages',
        'messages.writer',
        'messages.unreadUsers',
        'host',
        'participants',
      ],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      messages: event.messages,
      hostId: event.host.id,
    };
  }

  /**
   * Marks all unread messages for a specific user in an event as read.
   *
   * @param userId - The ID of the user.
   * @param eventId - The ID of the event.
   */
  async markMessagesAsRead(userId: string, eventId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['unreadMessages', 'unreadMessages.event'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const unreadMessagesForEvent = user.unreadMessages.filter(
      (message) => message.event.id === eventId,
    );

    if (unreadMessagesForEvent.length === 0) {
      return;
    }

    user.unreadMessages = user.unreadMessages.filter(
      (message) => message.event.id !== eventId,
    );

    await this.userRepository.save(user);
  }
}

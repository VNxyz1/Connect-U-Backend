import { GetMessageDTO } from './GetMessageDTO';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetEventChatDTO {
  @ApiProperty({
    description: 'Array of messages that the current user has read',
    type: [GetMessageDTO],
  })
  @Type(() => GetMessageDTO)
  readMessages: GetEventChatDTO[];

  @ApiProperty({
    description: 'Array of messages that the current user has not read',
    type: [GetMessageDTO],
  })
  @Type(() => GetEventChatDTO)
  unreadMessages: GetMessageDTO[];
}

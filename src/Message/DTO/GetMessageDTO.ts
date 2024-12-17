import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserProfileDTO } from '../../user/DTO/GetUserProfileDTO';

export class GetMessageDTO {
  @ApiProperty({
    description: 'The ID of the message',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The content of the message',
    example: 'Hello everyone! Looking forward to the event.',
  })
  text: string;

  @ApiProperty({
    description: 'The timestamp when the message was posted',
    example: '2024-06-15T12:34:56.789Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'The writer of the message (null for system messages)',
    type: GetUserProfileDTO,
    nullable: true,
  })
  @Type(() => GetUserProfileDTO)
  writer: GetUserProfileDTO | null;

  @ApiProperty({
    description: 'True if the current user is the host of the event',
    example: true,
  })
  isHost: boolean;
}

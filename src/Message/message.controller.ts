import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';
import { UtilsService } from '../utils/utils.service';
import { OkDTO } from '../serverDTO/OkDTO';
import { GetEventChatDTO } from './DTO/GetEventChatDTO';
import { CreateMessageDTO } from './DTO/CreateMessageDTO';
import { SocketGateway } from '../socket/socket.gateway';

@ApiTags('message')
@Controller('message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly utilsService: UtilsService,
    private readonly socketService: SocketGateway,
  ) {}

  @ApiResponse({
    type: OkDTO,
    description: 'Posts a new message in the event chat',
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @Post('/:eventId/message')
  async createMessage(
    @Body() body: CreateMessageDTO,
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    await this.utilsService.isHostOrParticipant(user, eventId);

    await this.messageService.createMessage(user, eventId, body.content);
    this.socketService.emitUpdateChat(eventId);

    return new OkDTO(true, 'Message was posted successfully');
  }

  @ApiResponse({
    type: GetEventChatDTO,
    description:
      'Retrieves the event chat, sorted by timestamp, with read and unread messages',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/:eventId')
  async getEventChat(
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ): Promise<GetEventChatDTO> {
    await this.utilsService.isHostOrParticipant(user, eventId);

    const { messages, hostId } =
      await this.messageService.getEventChat(eventId);

    return this.utilsService.transformEventChatToGetEventChatDTO(
      messages,
      user.id,
      hostId,
    );
  }

  @ApiResponse({
    type: OkDTO,
    description:
      'Marks all unread messages for the user in the specified event as read.',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/:eventId/read')
  async markMessagesAsRead(
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    await this.messageService.markMessagesAsRead(user.id, eventId);

    return new OkDTO(true, 'Unread messages have been marked as read.');
  }
}

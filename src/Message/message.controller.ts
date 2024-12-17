import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';
import { UtilsService } from '../utils/utils.service';
import { OkDTO } from '../serverDTO/OkDTO';

@ApiTags('message')
@Controller('message')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly utilsService: UtilsService,
  ) {}

  @ApiResponse({
    type: OkDTO,
    description: 'Posts a new message in the event chat',
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @Post('/:eventId')
  async createMessage(
    @Body('text') text: string,
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    await this.utilsService.isHostOrParticipant(user, eventId);

   await this.messageService.createMessage(
      user,
      eventId,
      text,
    );

    return new OkDTO(true, 'Message was posted successfully');
  }
}

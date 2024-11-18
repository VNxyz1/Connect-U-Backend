import {
  Controller,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestService } from './request.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';
import { OkDTO } from '../serverDTO/OkDTO';
import { EventService } from '../event/event.service';
import { UtilsService } from '../utils/utils.service';

@ApiTags('request')
@Controller('request')
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly utilsService: UtilsService,
    private readonly eventService: EventService,
  ) {}

  @ApiResponse({
    type: OkDTO,
    description: 'Creates a join request for a user to join an event',
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Post('/join/:eventId')
  @HttpCode(HttpStatus.CREATED)
  async createJoinRequest(
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ) {
    const event = await this.eventService.getEventById(eventId);

    await this.utilsService.isUserAllowedToJoinEvent(user, event);

    await this.requestService.postJoinRequest(eventId, user.id);
    return new OkDTO(true, 'Request was sent');
  }
}

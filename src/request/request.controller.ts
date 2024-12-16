import {
  Controller,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestService } from './request.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';
import { OkDTO } from '../serverDTO/OkDTO';
import { EventService } from '../event/event.service';
import { UtilsService } from '../utils/utils.service';
import { GetEventJoinRequestDTO } from './DTO/GetEventJoinRequestDTO';
import { GetUserJoinRequestDTO } from './DTO/GetUserJoinRequestDTO';

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

  @ApiResponse({
    type: [GetEventJoinRequestDTO],
    description: 'Fetches all requests sent by a specific user',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('join/user')
  @HttpCode(HttpStatus.OK)
  async getRequestsByUser(
    @User() user: UserDB,
  ): Promise<GetEventJoinRequestDTO[]> {
    const requests = await this.requestService.getRequestsByUser(user.id);

    return Promise.all(
      requests.map((request) =>
        this.utilsService.transformRequestDBtoGetEventJoinRequestDTO(request),
      ),
    );
  }

  @ApiResponse({
    type: [GetUserJoinRequestDTO],
    description: 'Fetches all join requests for a specific event',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('join/event/:eventId')
  @HttpCode(HttpStatus.OK)
  async getRequestsForEvent(
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ): Promise<GetUserJoinRequestDTO[]> {
    const requests = await this.requestService.getRequestsForEvent(
      eventId,
      user.id,
    );

    return Promise.all(
      requests.map((request) =>
        this.utilsService.transformRequestDBtoGetUserJoinRequestDTO(request),
      ),
    );
  }

  @Patch('/accept/:requestId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiResponse({
    type: OkDTO,
    description:
      'Accepts a join request, adds the user to the event, and deletes the request',
    status: HttpStatus.OK,
  })
  async acceptRequest(
    @Param('requestId') requestId: number,
    @User() currentUser: UserDB,
  ): Promise<OkDTO> {
    await this.requestService.acceptJoinRequest(requestId, currentUser.id);
    return new OkDTO(true, 'Request successfully accepted');
  }

  @ApiResponse({
    type: OkDTO,
    description: 'denies a join request for an event',
    status: HttpStatus.CREATED,
  })
  @Patch('/deny/:requestId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async denyRequest(
    @Param('requestId') requestId: number,
    @User() currentUser: UserDB,
  ): Promise<OkDTO> {
    await this.requestService.denyRequest(requestId, currentUser.id);
    return new OkDTO(true, 'Request successfully denied');
  }

  @Delete('/delete/:requestId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiResponse({
    type: OkDTO,
    description: 'Deletes a join request sent by the user',
    status: HttpStatus.OK,
  })
  async deleteRequest(
    @Param('requestId') requestId: number,
    @User() currentUser: UserDB,
  ): Promise<OkDTO> {
    await this.requestService.deleteJoinRequest(requestId, currentUser.id);
    return new OkDTO(true, 'Request successfully deleted');
  }
}

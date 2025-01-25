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
  NotFoundException,
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
import { UserService } from '../user/user.service';
import { SocketGateway } from '../socket/socket.gateway';

@ApiTags('request')
@Controller('request')
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly utilsService: UtilsService,
    private readonly eventService: EventService,
    private readonly userService: UserService,
    private readonly socketService: SocketGateway,
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

    const request = await this.requestService.postJoinRequest(eventId, user.id);
    this.socketService.emitNewInvitation(request.event.host.id);
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
    const requests = await this.requestService.getJoinRequestsByUser(user.id);

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
    const requests = await this.requestService.getJoinRequestsForEvent(
      eventId,
      user.id,
    );

    return Promise.all(
      requests.map((request) =>
        this.utilsService.transformRequestDBtoGetUserJoinRequestDTO(request),
      ),
    );
  }

  @ApiResponse({
    type: OkDTO,
    description:
      'Accepts a join request, adds the user to the event, and deletes the request',
    status: HttpStatus.OK,
  })
  @Patch('/accept/:requestId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async acceptRequest(
    @Param('requestId') requestId: number,
    @User() currentUser: UserDB,
  ): Promise<OkDTO> {
    const request = await this.requestService.acceptJoinRequest(
      requestId,
      currentUser.id,
    );
    this.socketService.emitInvitationStatusChanged(request.user.id);
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
    const request = await this.requestService.denyJoinRequest(
      requestId,
      currentUser.id,
    );
    this.socketService.emitInvitationStatusChanged(request.user.id);
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
    const request = await this.requestService.deleteJoinRequest(
      requestId,
      currentUser.id,
    );
    this.socketService.emitInvitationStatusChanged(request.event.host.id);
    return new OkDTO(true, 'Request successfully deleted');
  }

  @ApiResponse({
    type: OkDTO,
    description: 'Creates an invite for a user to join an event',
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Post('/invite/:eventId/:userId')
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @User() host: UserDB,
  ) {
    const event = await this.eventService.getEventById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.utilsService.isUserAllowedToJoinEvent(user, event);

    await this.requestService.createInvitation(eventId, user, host.id);
    this.socketService.emitNewInvitation(userId);
    return new OkDTO(true, 'Invitation was sent');
  }

  @ApiResponse({
    type: [GetUserJoinRequestDTO],
    description: 'Fetches all invitations for a specific event',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('invite/event/:eventId')
  @HttpCode(HttpStatus.OK)
  async getInvitationsForEvent(
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ): Promise<GetUserJoinRequestDTO[]> {
    const requests = await this.requestService.getInvitationsForEvent(
      eventId,
      user.id,
    );

    return Promise.all(
      requests.map((request) =>
        this.utilsService.transformRequestDBtoGetUserJoinRequestDTO(request),
      ),
    );
  }

  @ApiResponse({
    type: [GetEventJoinRequestDTO],
    description: 'Fetches all invitations sent to a specific user',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('invite/user')
  @HttpCode(HttpStatus.OK)
  async getInvitationsByUser(
    @User() user: UserDB,
  ): Promise<GetEventJoinRequestDTO[]> {
    const requests = await this.requestService.getInvitationsByUser(user.id);

    return Promise.all(
      requests.map((request) =>
        this.utilsService.transformRequestDBtoGetEventJoinRequestDTO(request),
      ),
    );
  }

  @ApiResponse({
    type: OkDTO,
    description:
      'Accepts an invitation, adds the user to the event, and deletes the request',
    status: HttpStatus.OK,
  })
  @Patch('/acceptInvite/:requestId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async acceptInvitation(
    @Param('requestId') requestId: number,
    @User() currentUser: UserDB,
  ): Promise<OkDTO> {
    const request = await this.requestService.acceptInvitation(
      requestId,
      currentUser.id,
    );
    this.socketService.emitInvitationStatusChanged(request.user.id);
    return new OkDTO(true, 'Invitation successfully accepted');
  }

  @ApiResponse({
    type: OkDTO,
    description: 'denies an invitation for an event',
    status: HttpStatus.CREATED,
  })
  @Patch('/denyInvite/:requestId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  async denyInvitation(
    @Param('requestId') requestId: number,
    @User() currentUser: UserDB,
  ): Promise<OkDTO> {
    const request = await this.requestService.denyInvitation(
      requestId,
      currentUser.id,
    );
    this.socketService.emitInvitationStatusChanged(request.event.host.id);
    return new OkDTO(true, 'Invitation successfully denied');
  }

  @Delete('/invite/:requestId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiResponse({
    type: OkDTO,
    description: 'Deletes an invitation sent by the user',
    status: HttpStatus.OK,
  })
  async deleteInvitation(
    @Param('requestId') requestId: number,
    @User() currentUser: UserDB,
  ): Promise<OkDTO> {
    const request = await this.requestService.deleteInvitation(
      requestId,
      currentUser.id,
    );
    this.socketService.emitInvitationStatusChanged(request.user.id);
    return new OkDTO(true, 'Invitation successfully deleted');
  }
}

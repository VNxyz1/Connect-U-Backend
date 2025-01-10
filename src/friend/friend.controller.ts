import { FriendService } from './friend.service';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OkDTO } from '../serverDTO/OkDTO';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';
import { GetUserProfileDTO } from '../user/DTO/GetUserProfileDTO';
import { UtilsService } from '../utils/utils.service';
import { EventDB } from '../database/EventDB';
import { EventService } from '../event/event.service';

@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendService: FriendService,
    private readonly utilsService: UtilsService,
    private readonly eventService: EventService,
  ) {}

  @ApiResponse({
    type: OkDTO,
    description: 'adds a friend to the users friendlist',
  })
  @Put('/:username/:inviteId')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async createFriend(
    @User() user: UserDB,
    @Param('inviteId') inviteId: string,
    @Param('username') username: string,
  ): Promise<OkDTO> {
    if (this.friendService.hasActiveUUID(username) == false) {
      throw new BadRequestException('Invitation link doesnt exist');
    }

    const activeLink = this.friendService.getActiveUUID(username);
    if (inviteId != activeLink) {
      throw new BadRequestException(
        'Your invite link is not correct or expired',
      );
    }

    if (user.username == username) {
      throw new BadRequestException('You cannot befriend yourself');
    }
    await this.friendService.createFriend(user, username);
    return new OkDTO(true, 'Friend was added');
  }

  @ApiResponse({
    type: [GetUserProfileDTO],
    description: 'Retrieves the list of friends for the authenticated user',
  })
  @Get('/allFriends')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async getFriends(@User() user: UserDB): Promise<GetUserProfileDTO[]> {
    const friends = await this.friendService.getFriends(user.id);
    return friends.map((friend) =>
      this.utilsService.transformUserDBtoGetUserProfileDTO(friend, false),
    );
  }

  @ApiResponse({
    type: [GetUserProfileDTO],
    description:
      'Retrieves the list of friends that meet the event requirements',
  })
  @Get('/filteredFriends/:eventId')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async getFilteredFriends(
    @User() user: UserDB,
    @Param('eventId') eventId: string,
  ): Promise<GetUserProfileDTO[]> {
    const event: EventDB = await this.eventService.getEventById(eventId);
    const participantIds = new Set(
      event.participants.map((participant) => participant.id),
    );

    const friends = await this.friendService.getFriends(user.id);
    const filteredFriends = [];
    for (const friend of friends) {
      try {
        if (participantIds.has(friend.id)) {
          continue;
        }

        const isAllowed = await this.utilsService.isUserAllowedToJoinEvent(
          friend,
          event,
        );
        if (isAllowed) {
          filteredFriends.push(
            this.utilsService.transformUserDBtoGetUserProfileDTO(friend, false),
          );
        }
      } catch {}
    }
    return filteredFriends;
  }
}

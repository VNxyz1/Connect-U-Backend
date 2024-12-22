import { FriendService } from './friend.service';
import { BadRequestException, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OkDTO } from '../serverDTO/OkDTO';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';

@ApiTags('friends')
@Controller('friends')
export class FriendsController {
  constructor(
    private readonly friendService: FriendService,
  ) {
  }

  @ApiResponse({
    type: OkDTO,
    description: 'adds a friend to the users friendlist',
  })
  @Put('/friend')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async createFriend(
    @User() user: UserDB,
    @Param('friendId') friendId: string,
  ): Promise<OkDTO> {
    if (user.id == friendId) {
      throw new BadRequestException('You cannot befriend yourself');
    }
    await this.friendService.createFriend(user, friendId);
    return new OkDTO(true, 'Friend was added');
  }
}

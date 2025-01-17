import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';

@Controller('push-notification')
export class PushNotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Get('chat/host')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async getChatPushNotificationsHost(
    @User() user: UserDB,
  ): Promise<Record<string, number>> {
    return await this.pushNotificationService.getUnreadMessagesMapHost(user.id);
  }

  @Get('chat/participant')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async getChatPushNotificationsParticipant(
    @User() user: UserDB,
  ): Promise<Record<string, number>> {
    return await this.pushNotificationService.getUnreadMessagesMapParticipant(
      user.id,
    );
  }

  @ApiResponse({
    description:
      'Gets a Record of all evnetIds of the users own hosted Events, together with the count of join requests',
    status: HttpStatus.OK,
  })
  @Get('event-join-requests')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async getPushNotificationsEventJoinRequests(
    @User() user: UserDB,
  ): Promise<Record<string, number>> {
    return await this.pushNotificationService.getJoinRequestsOfHost(user.id);
  }
}

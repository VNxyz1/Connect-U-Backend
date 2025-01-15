import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';

@Controller('push-notification')
export class PushNotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Get('host')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async getPushNotificationsHost(@User() user: UserDB) {
    return await this.pushNotificationService.getUnreadMessagesMapHost(user.id);
  }

  @Get('participant')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  async getPushNotificationsParticipant(@User() user: UserDB) {
    return await this.pushNotificationService.getUnreadMessagesMapParticipant(
      user.id,
    );
  }
}
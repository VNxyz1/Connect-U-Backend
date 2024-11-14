import { Controller, Post, Param, UseGuards, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestService } from './request.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';

@ApiTags('request')
@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @ApiResponse({
    description: 'Creates a join request for a user to join an event',
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Post('/join/:eventId')
  @HttpCode(HttpStatus.CREATED)
  async createJoinRequest(
    @Param('eventId') eventId: string,
    @User() user: UserDB
  ) {
    try {
      const request = await this.requestService.postJoinRequest(eventId, user.id);
      return { success: true, message: 'Request created', data: request };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      } else {
        throw error;
      }
    }
  }
}

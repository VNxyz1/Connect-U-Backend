import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CreateListDTO } from './DTO/CreateListDTO';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';
import { ListService } from './list.service';
import { CreateListResDTO } from './DTO/CreateListResDTO';
import { OkDTO } from '../serverDTO/OkDTO';
import { UtilsService } from '../utils/utils.service';

@ApiTags('list')
@Controller('list')
export class ListController {
  constructor(
    private readonly listService: ListService,
    private readonly utilsService: UtilsService,
  ) {}

  @ApiResponse({
    type: CreateListResDTO,
    description: 'Creates a new list for an event',
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @Post('/:eventId')
  async createList(
    @Body() body: CreateListDTO,
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    await this.utilsService.isHostOrParticipant(user, eventId);

    const newList = await this.listService.createList(
      user,
      eventId,
      body.title,
      body.description,
    );

    return new CreateListResDTO(
      true,
      'List was created successfully',
      newList.id,
    );
  }
}

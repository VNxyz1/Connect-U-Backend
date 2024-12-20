import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Param,
  Get,
  ForbiddenException,
  Delete,
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
import { GetListDetailsDTO } from './DTO/GetListDetailsDTO';
import { GetListDTO } from './DTO/GetListDTO';
import { SocketGateway } from '../socket/socket.gateway';
import { MessageService } from '../Message/message.service';

@ApiTags('list')
@Controller('list')
export class ListController {
  constructor(
    private readonly listService: ListService,
    private readonly utilsService: UtilsService,
    private readonly socketService: SocketGateway,
    private readonly messageService: MessageService,
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

    this.socketService.emitNewList(eventId);

    const systemMessageText = {
      key: 'eventChatPage.server-messages.new-list',
      params: { title: body.title },
    };

    // Pass the translation key and parameters to the message creation function
    await this.messageService.createMessage(null, eventId, systemMessageText);
    this.socketService.emitUpdateChat(eventId);

    return new CreateListResDTO(
      true,
      'List was created successfully',
      newList.id,
    );
  }

  @ApiResponse({
    type: GetListDetailsDTO,
    description: 'Retrieves a list by its ID',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/listDetails/:listId')
  async getListById(
    @Param('listId') listId: number,
    @User() user: UserDB,
  ): Promise<GetListDetailsDTO> {
    const list = await this.listService.getListById(listId);

    await this.utilsService.isHostOrParticipant(user, list.event.id);

    return this.utilsService.transformListDBtoGetListDetailsDTO(list, user.id);
  }

  @ApiResponse({
    type: [GetListDTO],
    description: 'Retrieves all lists for a specific event',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/event/:eventId')
  async getListsForEvent(
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ): Promise<GetListDTO[]> {
    await this.utilsService.isHostOrParticipant(user, eventId);

    const lists = await this.listService.getListsForEvent(eventId);

    return lists.map((list) =>
      this.utilsService.transformListDBtoGetListDTO(list),
    );
  }

  @ApiResponse({
    type: OkDTO,
    status: HttpStatus.OK,
    description: 'Deletes a list by its ID',
  })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Delete('/:listId')
  async deleteList(
    @Param('listId') listId: number,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    const list = await this.listService.getListById(listId);

    if (list.creator.id !== user.id && list.event.host.id !== user.id) {
      throw new ForbiddenException('You are not allowed to delete this list');
    }

    await this.listService.deleteList(list);
    return new OkDTO(true, 'List was deleted successfully');
  }
}

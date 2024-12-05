import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateListEntryDTO } from './DTO/CreateListEntryDTO';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListEntryService } from './listEntry.service';
import { UtilsService } from '../utils/utils.service';
import { UserDB } from '../database/UserDB';
import { User } from '../utils/user.decorator';
import { ListService } from '../list/list.service';
import { AuthGuard } from '../auth/auth.guard';
import { OkDTO } from '../serverDTO/OkDTO';

@ApiTags('list-entry')
@Controller('list-entry')
export class ListEntryController {
  constructor(
    private readonly listEntryService: ListEntryService,
    private readonly utilsService: UtilsService,
    private readonly listService: ListService,
  ) {}

  @ApiResponse({
    type: OkDTO,
    status: HttpStatus.CREATED,
    description: 'Creates a new list entry',
  })
  @Post('/:listId')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createListEntry(
    @Param('listId') listId: number,
    @User() user: UserDB,
    @Body() body: CreateListEntryDTO,
  ) {
    const list = await this.listService.getListById(listId);

    const isDuplicate = list.listEntries.some(
      (entry) => entry.content === body.content,
    );

    if (isDuplicate) {
      throw new BadRequestException(
        'A list entry with the same description already exists.',
      );
    }

    await this.utilsService.isHostOrParticipant(user, list.event.id);

    await this.listEntryService.createListEntry(listId, body.content);

    return new OkDTO(true, 'List Entry was created successfully');
  }

  @ApiResponse({
    type: OkDTO,
    status: HttpStatus.OK,
    description: 'Updates the list entry by adding or removing the logged-in user',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Patch('/:listEntryId')
  @HttpCode(HttpStatus.OK)
  async addUserToListEntry(
    @Param('listEntryId') listEntryId: number,
    @User() user: UserDB,
  ) {
    const listEntry = await this.listEntryService.getListEntryById(listEntryId);

    if (listEntry.user) {
      throw new ForbiddenException('There already is a user assigned.');
    }

    if (listEntry.user) {
      if (listEntry.user.id === user.id) {
        await this.listEntryService.removeUserFromListEntry(listEntry);
        return new OkDTO(true, 'user was removed from list');
      } else {
        throw new ForbiddenException(
          'Another user is already assigned to this list entry.',
        );
      }
    }

    await this.utilsService.isHostOrParticipant(user, listEntry.list.event.id);

    await this.listEntryService.updateListEntry(listEntry, user);

    return new OkDTO(true, 'List entry was updated successfully');
  }

  @ApiResponse({
    type: OkDTO,
    status: HttpStatus.OK,
    description: 'Deletes a list entry',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('/:listEntryId')
  async deleteListEntry(
    @Param('listEntryId') listEntryId: number,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    const listEntry = await this.listEntryService.getListEntryById(listEntryId);

    if (listEntry.user && listEntry.user.id !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to delete this list entry',
      );
    }

    await this.utilsService.isHostOrParticipant(user, listEntry.list.event.id);

    await this.listEntryService.deleteListEntry(listEntry);

    return new OkDTO(true, 'List entry was deleted successfully');
  }
}

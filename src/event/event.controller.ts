import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OkDTO } from '../serverDTO/OkDTO';
import { UtilsService } from '../utils/utils.service';
import { EventService } from './event.service';
import { CreateEventDTO } from './DTO/CreateEventDTO';
import { CategoryService } from '../category/category.service';
import { GenderService } from '../gender/gender.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';
import { GetEventCardDTO } from './DTO/GetEventCardDTO';
import { EventDB } from '../database/EventDB';
import { EventtypeEnum } from '../database/enums/EventtypeEnum';
import { CreateEventResDTO } from './DTO/CreateEventResDTO';
import { GetEventDetailsDTO } from './DTO/GetEventDetailsDTO';
import { TagService } from '../tag/tag.service';

@ApiTags('event')
@Controller('event')
export class EventController {
  constructor(
    public readonly eventService: EventService,
    public readonly utilsService: UtilsService,
    public readonly categoryService: CategoryService,
    public readonly genderService: GenderService,
    public readonly tagService: TagService,
  ) {}

  @ApiResponse({
    type: CreateEventResDTO,
    description: 'Creates a new event',
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @Post()
  async createEvent(@Body() body: CreateEventDTO, @User() user: UserDB) {
    const categories = await this.categoryService.getCategoriesByIds(
      body.categories,
    );
    const genders =
      body.preferredGenders && body.preferredGenders.length > 0
        ? await this.genderService.getGendersByIds(body.preferredGenders)
        : [];

    if (body.startAge > body.endAge && body.endAge !== null) {
      throw new BadRequestException(
        'The start age must be lesser then the end age.',
      );
    }

    if (!this.utilsService.isFutureDate(body.dateAndTime)) {
      throw new BadRequestException('Event Date must be in the future');
    }

    let eventTags = [];
    if (body.tags) {
      eventTags = await this.tagService.findOrCreateTags(body.tags);
    }

    const newEvent = await this.eventService.createEvent(
      user,
      eventTags,
      categories,
      genders,
      body,
    );

    return new CreateEventResDTO(true, 'Event was created', newEvent.id);
  }

  @ApiResponse({
    type: GetEventDetailsDTO,
    description: 'gets an event by its ID',
  })
  @Get('/eventDetails/:eventId')
  async getEventById(
    @Param('eventId') eventId: string,
    @User() user: UserDB | null,
  ): Promise<GetEventDetailsDTO> {
    const event = await this.eventService.getEventById(eventId);

    let isHost: boolean = false;
    let isParticipant: boolean = false;
    let isLoggedIn: boolean = false;

    if (user) {
      if (event.host.id === user.id) {
        isHost = true;
      }
      isParticipant = event.participants.some(
        (participant) => participant.id === user.id,
      );
      isLoggedIn = true;
    }
    return await this.utilsService.transformEventDBtoGetEventDetailsDTO(
      event,
      isHost,
      isParticipant,
      isLoggedIn,
    );
  }

  @ApiResponse({
    type: [GetEventCardDTO],
    description: 'gets all events',
  })
  @Get('/allEvents')
  async getAllEvents(): Promise<GetEventCardDTO[]> {
    const events = await this.eventService.getAllEvents();
    return await Promise.all(
      events.map(async (event) => {
        return this.utilsService.transformEventDBtoGetEventCardDTO(event);
      }),
    );
  }

  @ApiResponse({
    type: [GetEventCardDTO],
    description: 'Gets events where the current user is a participant',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/participatingEvents')
  async getParticipatingEvents(
    @User() user: UserDB,
  ): Promise<GetEventCardDTO[]> {
    const events = await this.eventService.getParticipatingEvents(user.id);

    return await Promise.all(
      events.map(async (event) => {
        return this.utilsService.transformEventDBtoGetEventCardDTO(event);
      }),
    );
  }

  @ApiResponse({
    type: [GetEventCardDTO],
    description: 'gets the events the current user is hosting',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/hostingEvents')
  async getHostingEvents(@User() user: UserDB): Promise<GetEventCardDTO[]> {
    const events = await this.eventService.getHostingEvents(user.id);
    return await Promise.all(
      events.map(async (event) => {
        return this.utilsService.transformEventDBtoGetEventCardDTO(event);
      }),
    );
  }

  @ApiResponse({
    type: [GetEventCardDTO],
    description:
      'gets the upcoming and live events the current user is hosting or participating',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/upcoming')
  async getUpcomingEvents(@User() user: UserDB): Promise<GetEventCardDTO[]> {
    const events = await this.eventService.getUpcomingAndLiveEvents(user.id);
    return await Promise.all(
      events.map(async (event) => {
        return this.utilsService.transformEventDBtoGetEventCardDTO(event);
      }),
    );
  }

  @ApiResponse({
    type: OkDTO,
    description: 'Adds the user to the event participants list',
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Post('/join/:eventId')
  async addUserToEvent(
    @User() user: UserDB,
    @Param('eventId') eventId: string,
  ): Promise<OkDTO> {
    const event: EventDB = await this.eventService.getEventById(eventId);
    if (event.type != EventtypeEnum.public) {
      throw new BadRequestException('Event has to be public');
    }
    await this.utilsService.isUserAllowedToJoinEvent(user, event);

    await this.eventService.addUserToEvent(user, eventId);
    return new OkDTO(true, 'user was added to participant list');
  }

  @ApiResponse({
    type: OkDTO,
    description: 'Removes the user from the event participants list',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Post('/leave/:eventId')
  async removeUserFromEvent(
    @User() user: UserDB,
    @Param('eventId') eventId: string,
  ): Promise<OkDTO> {
    await this.eventService.removeUserFromEvent(user, eventId);
    return new OkDTO(true, 'User was removed from participant list');
  }
}

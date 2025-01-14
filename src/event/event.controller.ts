import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller, ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
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
import { FilterDTO } from './DTO/FilterDTO';
import {
  paginate,
  Pagination,
  PaginationParams,
} from '../utils/PaginationParams';
import { RequestService } from '../request/request.service';

@ApiTags('event')
@Controller('event')
export class EventController {
  constructor(
    public readonly eventService: EventService,
    public readonly utilsService: UtilsService,
    public readonly categoryService: CategoryService,
    public readonly requestService: RequestService,
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

    if (event.type === 3) {
      if (!user) {
        throw new ForbiddenException('Access denied. Private event requires authentication.');
      }

      const isAuthorized = await this.utilsService.isHostOrParticipant(user, eventId) ||
        await this.requestService.hasUserRequestForEvent(eventId, user.id);

      if (!isAuthorized) {
        throw new ForbiddenException('Access denied. You are not authorized to view this event.');
      }
    }

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
      await this.eventService.setEventAsClicked(event, user);
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
    description:
      'A paginated list of all public, half-private, upcoming or live events sorted by popularity',
  })
  @ApiQuery({
    type: Pagination,
  })
  @Get('/allEvents')
  async getAllEvents(
    @PaginationParams() paginationParams: Pagination,
  ): Promise<GetEventCardDTO[]> {
    const events = await this.eventService.getAllActiveEventsByPopularity(
      paginationParams.page,
      paginationParams.size,
    );
    return await Promise.all(
      events.map(async (event) => {
        return this.utilsService.transformEventDBtoGetEventCardDTO(event);
      }),
    );
  }

  @ApiResponse({
    type: Promise<{ events: GetEventCardDTO[]; total: number }>,
    description: 'gets events using the preferred filters',
  })
  @ApiQuery({
    type: Pagination,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/filteredEvents')
  async getFilteredEvents(
    @User() user: UserDB,
    @Query() query: FilterDTO,
    @PaginationParams() pagination: Pagination,
  ):  Promise<{ events: GetEventCardDTO[]; total: number }> {
    if (query.isOnline === false && query.isInPlace === false) {
      throw new BadRequestException(
        'An event must be either online or in place.',
      );
    }
    if (query.isPublic === false && query.isHalfPublic === false) {
      throw new BadRequestException(
        'An event must be either public or half public.',
      );
    }

    const [events, total] = await this.eventService.getFilteredEvents(
      user.id,
      query,
      pagination.page,
      pagination.size,
    );

    const transformedEvents = await Promise.all(
      events.map(async (event: EventDB) => {
        return this.utilsService.transformEventDBtoGetEventCardDTO(event);
      }),
    );

    return { events: transformedEvents, total };
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

  @ApiResponse({
    type: [GetEventCardDTO],
    description: 'Returns the current fy page of the logged in user',
    status: HttpStatus.OK,
  })
  @ApiQuery({
    type: Pagination,
  })
  @ApiOperation({
    summary: 'Get personalized events for the logged-in user',
    description: `This endpoint returns a personalized list of events (fy page) for the currently logged-in user.
  The returned events are sorted based on relevance to the user, considering factors such as:
  - Events the user is hosting or participating in
  - Events the user has interacted with (e.g., clicked on)
  - User preferences for categories, tags, and cities

  The events can be paginated using the provided pagination parameters (page and size).`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A paginated list of personalized events',
    type: [GetEventCardDTO],
    example: {
      example1: {
        summary: 'Successful Response',
        value: [
          {
            id: 1,
            title: 'Music Festival',
            city: 'New York',
            dateAndTime: '2025-01-20T18:00:00Z',
            categories: ['Music', 'Outdoor'],
            tags: ['Concert', 'Festival'],
            picture: 'https://example.com/event1.jpg',
            participantsNumber: 100,
            isOnline: false,
          },
          {
            id: 2,
            title: 'Tech Conference',
            city: 'San Francisco',
            dateAndTime: '2025-02-10T10:00:00Z',
            categories: ['Technology'],
            tags: ['Innovation', 'Networking'],
            picture: 'https://example.com/event2.jpg',
            participantsNumber: 200,
            isOnline: true,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid pagination parameters provided.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized. The user must be logged in and provide a valid access token.',
  })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('fy-page')
  async getHomePage(
    @User() user: UserDB,
    @PaginationParams() paginationParams: Pagination,
  ): Promise<GetEventCardDTO[]> {
    const events = await this.eventService.fyPageAlgo(user.id);

    const paginatedEvents = paginate(
      events,
      paginationParams.size,
      paginationParams.page,
    );

    const friendsEvents = await this.eventService.getFriendsEvents(user.id);

    return await Promise.all(
      paginatedEvents.map(async (event) => {
        return this.utilsService.transformEventDBtoGetEventCardDTO(
          event,
          friendsEvents,
        );
      }),
    );
  }
}

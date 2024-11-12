import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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

@ApiTags('event')
@Controller('event')
export class EventController {
  constructor(
    public readonly eventService: EventService,
    public readonly utilsService: UtilsService,
    public readonly categoryService: CategoryService,
    public readonly genderService: GenderService,
  ) {}

  @ApiResponse({
    type: OkDTO,
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
    const genders = await this.genderService.getGendersByIds(
      body.preferredGenders,
    );

    if (body.startAge > body.endAge) {
      throw new BadRequestException(
        'The start age must be lesser then the end age.',
      );
    }

    await this.eventService.createEvent(user, categories, genders, body);
    return new OkDTO(true, 'Event was created');
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
    description: 'gets the events the current user is hosting',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/hostingEvents')
  async getHostingEvents( @User() user: UserDB): Promise<GetEventCardDTO[]> {
    const events = await this.eventService.getHostingEvents(user);
    return await Promise.all(
      events.map(async (event) => {
        return this.utilsService.transformEventDBtoGetEventCardDTO(event);
      }),
    );
  }
}

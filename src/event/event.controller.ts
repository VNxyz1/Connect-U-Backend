import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { OkDTO } from '../serverDTO/OkDTO';
import { UtilsService } from '../utils/utils.service';
import { EventService } from './event.service';
import { CreateEventDTO } from './DTO/CreateEventDTO';
import { CategoryService } from '../category/category.service';
import { GenderService } from '../gender/gender.service';
import { UserService } from '../user/user.service';
import { GetEventCardDTO } from './DTO/GetEventCardDTO';

@ApiTags('event')
@Controller('event')
export class EventController {
  constructor(
    public readonly eventService: EventService,
    public readonly utilsService: UtilsService,
    public readonly categoryService: CategoryService,
    public readonly genderService: GenderService,
    public readonly userService: UserService,
  ) {}


  @ApiResponse({
    type: OkDTO,
    description: 'Creates a new event',
    status: HttpStatus.CREATED,
  })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createEvent(@Body() body: CreateEventDTO) {
    const user = await this.userService.findByUsername('testUser');
    const categories = await this.categoryService.getCategoriesByIds(
      body.categories,
    );
    const genders = await this.genderService.getGendersByIds(
      body.preferredGenders,
    );

    await this.eventService.createEvent(user, categories, genders, body);
    return new OkDTO(true, 'Event was created');
  }

  @ApiResponse({
    type: [GetEventCardDTO],
    description: 'gets all events except for the users',
  })
  @Get('/allEvents')
  async getOwnRequests(): Promise<GetEventCardDTO[]> {
    const user  = await this.userService.findByUsername('testUser');
      const events = await this.eventService.getAllEvents(user);
      return await Promise.all(
        events.map(async (event) => {
          return this.utilsService.transformEventDBtoGetEventCardDTO(event);
        }),
      );
  }
}

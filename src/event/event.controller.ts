import { ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { OkDTO } from '../serverDTO/OkDTO';
import { UtilsService } from '../utils/utils.service';
import { EventService } from './event.service';
import { CreateEventDTO } from './DTO/CreateEventDTO';
import { CategoryService } from '../category/category.service';
import { GenderService } from '../gender/gender.service';

@ApiTags('event')
@Controller('event')
export class EventController {
  constructor(
    public readonly eventService: EventService,
    public readonly utils: UtilsService,
    public readonly categoryService: CategoryService,
    public readonly genderService: GenderService,
  ) {}

  @ApiResponse({
    type: OkDTO,
    description: 'Creates a new event',
    status: HttpStatus.CREATED,
  })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createEvent(@Body() body: CreateEventDTO) {

    const categories = await this.categoryService.getCategoriesByIds(body.categories);
    const genders = await this.genderService.getGendersByIds(body.preferredGenders)

    await this.eventService.createEvent(categories, genders, body);
    return new OkDTO(true, 'Event was created');
  }
}

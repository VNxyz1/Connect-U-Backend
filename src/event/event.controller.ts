import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
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
import { UserService } from '../user/user.service';
import { AuthGuard } from '../auth/auth.guard';
import { UserDB } from '../database/UserDB';
import { User } from '../utils/user.decorator';

@ApiTags('event')
@Controller('event')
export class EventController {
  constructor(
    public readonly eventService: EventService,
    public readonly utils: UtilsService,
    public readonly categoryService: CategoryService,
    public readonly genderService: GenderService,
    public readonly userService: UserService,
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
}

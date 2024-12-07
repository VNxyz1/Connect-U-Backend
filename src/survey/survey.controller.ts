import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Param, Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';
import { SurveyService } from './survey.service';
import { UtilsService } from '../utils/utils.service';
import { CreateSurveyDTO } from './DTO/CreateSurveyDTO';
import { CreateSurveyResDTO } from './DTO/CreateSurveyResDTO';
import { OkDTO } from '../serverDTO/OkDTO';

@ApiTags('survey')
@Controller('survey')
export class SurveyController {
  constructor(
    private readonly surveyService: SurveyService,
    private readonly utilsService: UtilsService,
  ) {}

  @ApiResponse({
    type: CreateSurveyResDTO,
    description: 'Creates a new survey for an event',
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard)
  @Post('/:eventId')
  async createSurvey(
    @Body() body: CreateSurveyDTO,
    @Param('eventId') eventId: string,
    @User() user: UserDB,
  ): Promise<CreateSurveyResDTO> {
    await this.utilsService.isHostOrParticipant(user, eventId);

    const newSurvey = await this.surveyService.createSurvey(
      user,
      eventId,
      body
    );

    return new CreateSurveyResDTO(
      true,
      'Survey was created successfully',
      newSurvey.id,
    );
  }

  @ApiResponse({
    type: OkDTO,
    status: HttpStatus.OK,
    description:
      'Updates the list entry by adding or removing the logged-in user',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Patch('/:surveyEntryId')
  @HttpCode(HttpStatus.OK)
  async addUserToListEntry(
    @Param('surveyEntryId') surveyEntryId: number,
    @User() user: UserDB,
  ) {
    const surveyEntry = await this.surveyService.getSurveyEntryById(surveyEntryId);

    await this.utilsService.isHostOrParticipant(user, surveyEntry.survey.event.id);

    const isUserInSurvey = (await surveyEntry.users).some(
      (surveyUser) => surveyUser.id === user.id,
    );

    if (isUserInSurvey) {
      await this.surveyService.removeVote(user, surveyEntry);
      return new OkDTO(true, 'User removed from survey entry');
    } else {
      await this.surveyService.addVote(user, surveyEntry);
      return new OkDTO(true, 'Survey entry was updated successfully');
    }
  }

  /*
  @ApiResponse({
    type: GetSurveyDetailsDTO,
    description: 'Retrieves a survey by its ID',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/details/:surveyId')
  async getSurveyById(
    @Param('surveyId') surveyId: number,
    @User() user: UserDB,
  ): Promise<GetSurveyDetailsDTO> {
    const survey = await this.surveyService.getSurveyById(surveyId);

    await this.utilsService.isHostOrParticipant(user, survey.event.id);

    return this.utilsService.transformSurveyDBToGetSurveyDetailsDTO(survey);
  }

  @ApiResponse({
    type: OkDTO,
    status: HttpStatus.OK,
    description: 'Deletes a survey by its ID',
  })
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Delete('/:surveyId')
  async deleteSurvey(
    @Param('surveyId') surveyId: number,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    const survey = await this.surveyService.getSurveyById(surveyId);

    if (survey.creator.id !== user.id && survey.event.host.id !== user.id) {
      throw new ForbiddenException('You are not allowed to delete this survey');
    }

    await this.surveyService.deleteSurvey(survey);
    return new OkDTO(true, 'Survey was deleted successfully');
  }

   */
}

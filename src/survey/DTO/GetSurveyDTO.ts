import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserProfileDTO } from '../../user/DTO/GetUserProfileDTO';
import { GetSurveyEntryDTO } from './GetSurveyEntryDTO';

export class GetSurveyDTO {
  @ApiProperty({ description: 'The ID of the survey', example: 1 })
  id: number;

  @ApiProperty({
    description: 'The title of the survey',
    example: 'event rating',
  })
  title: string;

  @ApiProperty({
    description: 'The description of the survey',
    example: 'how did you like the event?',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'The creator of the survey',
    type: GetUserProfileDTO,
  })
  @Type(() => GetUserProfileDTO)
  creator: GetUserProfileDTO;
}

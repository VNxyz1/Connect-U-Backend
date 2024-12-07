import { ApiProperty } from '@nestjs/swagger';
import { GetUserProfileDTO } from '../../user/DTO/GetUserProfileDTO';

export class GetSurveyEntryDTO {
  @ApiProperty({ description: 'Unique identifier for the survey entry' })
  id: number;

  @ApiProperty({ description: 'Content of the survey entry' })
  content: string;

  @ApiProperty({
    description: 'List of users associated with this survey entry',
    type: [GetUserProfileDTO],
  })
  users: GetUserProfileDTO[];
}

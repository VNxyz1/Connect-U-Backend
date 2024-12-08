import { ApiProperty } from '@nestjs/swagger';

export class CreateSurveyResDTO {
  @ApiProperty()
  ok: boolean;
  @ApiProperty()
  message: string;
  @ApiProperty()
  surveyId: number;
  constructor(ok: boolean, message: string, surveyId: number) {
    this.ok = ok;
    this.message = message;
    this.surveyId = surveyId;
  }
}

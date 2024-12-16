import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum } from '../../database/enums/GenderEnum';

export class GetGenderDTO {
  @ApiProperty({ description: 'the ID of the gender', example: 1 })
  id: number;

  @ApiProperty({ description: 'the gender', example: 2 })
  gender: GenderEnum;
}

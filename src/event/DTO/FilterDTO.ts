import {
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterDTO {
  @ApiPropertyOptional({
    description: 'the date of the drive',
    example: '2024-06-13T18:21:15.068Z',
  })
  @IsOptional()
  @IsDateString()
  date?: Date;
}

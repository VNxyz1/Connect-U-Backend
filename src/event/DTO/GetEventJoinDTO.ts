import { ApiProperty } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { StatusEnum } from '../../database/enums/StatusEnum';


export class GetEventJoinDTO {
  @ApiProperty({ description: 'the ID of the event', example: 1 })
  id: string;

  @ApiProperty({
    description: 'date and time of the event',
    example: '2024-12-15T18:00:00Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  dateAndTime: string;

  @ApiProperty({
    description: 'Der Titel des Events',
    example: 'Java-Programmierung für Anfänger',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Das Bild des Events',
    example: 'emtpy.png',
  })
  @IsString()
  @IsNotEmpty()
  picture: string;

  @ApiProperty({
    description: 'Der Status des Events',
    example: 2,
  })
  @IsNotEmpty()
  status: StatusEnum;
}

import { ApiProperty } from '@nestjs/swagger';
import { EventtypeEnum } from '../../database/enums/EventtypeEnum';
import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { StatusEnum } from '../../database/enums/StatusEnum';
import { GetCategoryDTO } from '../../category/DTO/GetCategoryDTO';
import { Type } from 'class-transformer';
import { GetGenderDTO } from '../../gender/DTO/GetGenderDTO';
import { GetUserProfileDTO } from '../../user/DTO/GetUserProfileDTO';

export class GetEventDetailsDTO {
  @ApiProperty({ description: 'The ID of the event', example: '1' })
  id: string;

  @ApiProperty({ type: [GetCategoryDTO] })
  @ValidateNested({ each: true })
  @Type(() => GetCategoryDTO)
  categories: GetCategoryDTO[];

  @ApiProperty({ type: [GetGenderDTO] })
  @ValidateNested({ each: true })
  @Type(() => GetGenderDTO)
  preferredGenders: GetGenderDTO[];

  @ApiProperty({ type: [GetUserProfileDTO] })
  @ValidateNested({ each: true })
  @Type(() => GetUserProfileDTO)
  participants: GetUserProfileDTO[];

  @ApiProperty({ type: GetUserProfileDTO })
  @Type(() => GetUserProfileDTO)
  host: GetUserProfileDTO;

  @ApiProperty({
    description: 'Date and time of the event',
    example: '2024-12-15T18:00:00Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  dateAndTime: string;

  @ApiProperty({
    description: 'Title of the event',
    example: 'Java Programming for Beginners',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Description of the event',
    example: 'A beginner-friendly Java programming workshop.',
  })
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Picture for the event',
    example: 'event.png',
  })
  @IsString()
  @IsNotEmpty()
  picture: string;

  @ApiProperty({
    description: 'Status of the event',
    example: StatusEnum.upcoming,
  })
  @IsNotEmpty()
  status: StatusEnum;

  @ApiProperty({
    description: 'Type of the event',
    example: EventtypeEnum.public,
  })
  @IsNotEmpty()
  type: EventtypeEnum;

  @ApiProperty({
    description: 'Indicates whether the event is online',
    example: true,
  })
  @IsBoolean()
  isOnline: boolean;

  @ApiProperty({
    description: 'Street number of the event location',
    example: '42',
  })
  @IsString()
  streetNumber?: string;

  @ApiProperty({
    description: 'Street of the event location',
    example: 'Main Street',
  })
  @IsString()
  street?: string;

  @ApiProperty({
    description: 'ZIP code of the event location',
    example: '10115',
  })
  @IsString()
  zipCode?: string;

  @ApiProperty({
    description: 'City of the event location',
    example: 'Berlin',
  })
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Current number of participants',
    example: 4,
  })
  participantsNumber: number;

  @ApiProperty({
    description: 'Maximum number of participants allowed',
    example: 50,
  })
  @IsNumber()
  @IsNotEmpty()
  maxParticipantsNumber: number;

  @ApiProperty({
    description: 'Start age limit for participants',
    example: 18,
  })
  @IsNumber()
  startAge?: number;

  @ApiProperty({
    description: 'End age limit for participants',
    example: 35,
  })
  @IsNumber()
  endAge?: number;
}

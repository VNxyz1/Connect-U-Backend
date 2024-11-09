import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsNotEmpty, IsNumber, IsOptional,
  IsString, ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventtypeEnum } from '../../database/enums/EventtypeEnum';

export class CreateEventDTO {

  @ApiProperty({
    description: 'the IDs of the categories chosen for the event',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  categories: number[];

  @ApiProperty({
    description: 'date and time of the event',
  })
  @IsISO8601()
  @IsNotEmpty()
  dateAndTime: string;

  @ApiProperty({
    description: 'the description of the event',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The type of the event',
    example: 2,
  })
  @IsNotEmpty()
  type: EventtypeEnum;

  @ApiProperty({
    description: 'Checks if the event is online',
    example: true,
  })
  @IsBoolean()
  isOnline: boolean;

  @ApiProperty({
    description: 'Checks if the user wants to share their address',
    example: true,
  })
  @IsBoolean()
  showAddress: boolean;

  @ApiProperty({
    description: 'Street number of the event location',
    required: false,
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  streetNumber?: string;

  @ApiProperty({
    description: 'Street name of the event location',
    required: false,
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  street?: string;

  @ApiProperty({
    description: 'Zip code of the event location',
    required: false,
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  zipCode?: string;

  @ApiProperty({
    description: 'City of the event location',
    required: false,
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  city?: string;

  @ApiProperty({
    description: 'Number of participants expected',
  })
  @IsNumber()
  @IsNotEmpty()
  participantsNumber: number;

  @ApiProperty({
    description: 'the genders preferred for the event',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  preferredGenders: number[];

  @ApiProperty({
    description: 'Minimum age requirement for participants',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  startAge?: number;

  @ApiProperty({
    description: 'Maximum age limit for participants',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  endAge?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

export class CreateSurveyDTO {
  @ApiProperty({
    description: 'The title of the survey',
    example: 'Event Feedback Survey',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @ApiProperty({
    description: 'The description of the survey',
    example: 'A survey to gather feedback from participants',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;

  @ApiProperty({
    description: 'An array of content for the survey entries',
    example: ['Did you like the event?', 'Did you like the food?'],
    type: [String],
  })
  @IsArray({ message: 'Entries must be an array' })
  @ArrayMaxSize(50, { message: 'You can have a maximum of 50 survey entries' })
  @ArrayMinSize(2, { message: 'You must provide at least 2 survey entries' })
  @IsString({ each: true, message: 'Each entry must be a string' })
  entries: string[];
}

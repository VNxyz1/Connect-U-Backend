import { IsArray, IsBoolean, IsISO8601, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GetCategoryDTO } from '../../category/DTO/GetCategoryDTO';
import { Type } from 'class-transformer';
import { StatusEnum } from '../../database/enums/StatusEnum';
import { EventtypeEnum } from '../../database/enums/EventtypeEnum';

export class GetEventCardDTO {
  @ApiProperty({ description: 'The ID of the event', example: 1 })
  id: string;

  @ApiProperty({ type: [GetCategoryDTO] })
  @ValidateNested({ each: true })
  @Type(() => GetCategoryDTO)
  categories: GetCategoryDTO[];

  @ApiProperty({
    description: 'Date and time of the event',
    example: '2024-12-15T18:00:00Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  dateAndTime: string;

  @ApiProperty({
    description: 'The title of the event',
    example: 'Java Programming for Beginners',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'The image of the event',
    example: 'empty.png',
  })
  @IsString()
  @IsNotEmpty()
  picture: string;

  @ApiProperty({
    description: 'The status of the event',
    example: 2,
  })
  @IsNotEmpty()
  status: StatusEnum;

  @ApiProperty({
    description: 'The type of the event',
    example: 2,
  })
  @IsNotEmpty()
  type: EventtypeEnum;

  @ApiProperty({
    description: 'Whether the event is online',
    example: true,
  })
  @IsBoolean()
  isOnline: boolean;

  @ApiProperty({
    description: 'City of the event location',
    required: false,
    example: 'Berlin',
  })
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Number of current participants',
    example: 4,
  })
  participantsNumber: number;

  @ApiProperty({
    description: 'Number of allowed participants',
    example: 50,
  })
  @IsNumber()
  @IsNotEmpty()
  maxParticipantsNumber: number;

  @ApiProperty({
    description: 'Array of tags associated with the event',
    example: ['coding', 'beginner'],
    type: [String],
    nullable: true,
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: 'Indicates whether a friend is participating',
    example: true,
    type: Boolean,
    nullable: true,
  })
  @IsBoolean()
  participatingFriend?: boolean;
}

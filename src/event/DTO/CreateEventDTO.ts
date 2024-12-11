import {
  ArrayNotEmpty,
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventtypeEnum } from '../../database/enums/EventtypeEnum';

export class CreateEventDTO {
  @ApiProperty({
    description: 'Die IDs der für das Event gewählten Kategorien',
    type: [Number],
    example: [1, 3, 5],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(3, { message: 'A maximum of 3 categories can be selected' })
  @IsNumber({}, { each: true })
  categories: number[];

  @ApiProperty({
    description: 'Datum und Uhrzeit des Events',
    example: '2024-12-15T18:00:00Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  dateAndTime: string;

  @ApiProperty({
    description: 'Der Titel des Events',
    example: 'Java-Programmierung',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'Title cannot exceed 50 characters' })
  @Matches(/\S/, { message: 'Title cannot contain only whitespace' })
  title: string;

  @ApiProperty({
    description: 'Die Beschreibung des Events',
    example:
      'Kommen Sie zu unserem spannenden und interaktiven Coding-Workshop!',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: 'Der Typ des Events',
    example: 2,
  })
  @IsNotEmpty()
  type: EventtypeEnum;

  @ApiProperty({
    description: 'Ob das Event online stattfindet',
    example: true,
  })
  @IsBoolean()
  isOnline: boolean;

  @ApiProperty({
    description: 'Ob der Benutzer seine Adresse teilen möchte',
    example: true,
  })
  @IsBoolean()
  showAddress: boolean;

  @ApiProperty({
    description: 'Hausnummer des Veranstaltungsortes',
    required: false,
    example: '123',
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Street number cannot contain only whitespace' })
  streetNumber?: string;

  @ApiProperty({
    description: 'Straßenname des Veranstaltungsortes',
    required: false,
    example: 'Hauptstraße',
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Street cannot contain only whitespace' })
  street?: string;

  @ApiProperty({
    description: 'Postleitzahl des Veranstaltungsortes',
    required: false,
    example: '12345',
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Zip code cannot contain only whitespace' })
  zipCode?: string;

  @ApiProperty({
    description: 'Stadt des Veranstaltungsortes',
    required: false,
    example: 'Berlin',
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'City cannot contain only whitespace' })
  city?: string;

  @ApiProperty({
    description: 'Anzahl der erlaubten Teilnehmer',
    example: 50,
  })
  @IsInt({ message: 'Participants number must be an integer' })
  @Min(2, { message: 'Participants number must be at least 2' })
  @Max(100, { message: 'Participants number cannot exceed 100' })
  participantsNumber: number;

  @ApiProperty({
    description: 'Die bevorzugten Geschlechter für das Event',
    type: [Number],
    example: [1, 2],
  })
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  preferredGenders: number[] = [];

  @ApiProperty({
    description: 'Mindestalter für die Teilnehmer',
    required: false,
    example: 18,
  })
  @IsNumber()
  @Min(16, { message: 'Minimum age cannot be less than 16' })
  @Max(150, { message: 'Minimum age cannot exceed 150' })
  @IsOptional()
  startAge?: number;

  @ApiProperty({
    description: 'Höchstalter für die Teilnehmer',
    required: false,
    example: 40,
  })
  @IsNumber()
  @Min(16, { message: 'Maximum age cannot be less than 16' })
  @Max(150, { message: 'Maximum age cannot exceed 150' })
  @IsOptional()
  endAge?: number;

  @ApiProperty({
    description: 'An array of tags for the event',
    example: ['girlstrip', 'coding'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Entries must be an array' })
  @ArrayMaxSize(50, { message: 'You can have a maximum of 50 tags' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @MaxLength(20, {
    each: true,
    message: 'Each tag must be at most 20 characters long',
  })
  @Matches(/^\S*$/, { each: true, message: 'Tags cannot contain spaces' })
  tags?: string[];
}

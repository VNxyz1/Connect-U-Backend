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
    description: 'Die IDs der für das Event gewählten Kategorien',
    type: [Number],
    example: [1, 3, 5],
  })
  @IsArray()
  @ArrayNotEmpty()
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
    description: 'Die Beschreibung des Events',
    example: 'Kommen Sie zu unserem spannenden und interaktiven Coding-Workshop!',
  })
  @IsString()
  @IsNotEmpty()
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
  streetNumber?: string;

  @ApiProperty({
    description: 'Straßenname des Veranstaltungsortes',
    required: false,
    example: 'Hauptstraße',
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  street?: string;

  @ApiProperty({
    description: 'Postleitzahl des Veranstaltungsortes',
    required: false,
    example: '12345',
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  zipCode?: string;

  @ApiProperty({
    description: 'Stadt des Veranstaltungsortes',
    required: false,
    example: 'Berlin',
  })
  @ValidateIf((o) => !o.isOnline)
  @IsString()
  @IsNotEmpty()
  city?: string;

  @ApiProperty({
    description: 'Anzahl der erwarteten Teilnehmer',
    example: 50,
  })
  @IsNumber()
  @IsNotEmpty()
  participantsNumber: number;

  @ApiProperty({
    description: 'Die bevorzugten Geschlechter für das Event',
    type: [Number],
    example: [1, 2],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  preferredGenders: number[];

  @ApiProperty({
    description: 'Mindestalter für die Teilnehmer',
    required: false,
    example: 18,
  })
  @IsNumber()
  @IsOptional()
  startAge?: number;

  @ApiProperty({
    description: 'Höchstalter für die Teilnehmer',
    required: false,
    example: 40,
  })
  @IsNumber()
  @IsOptional()
  endAge?: number;
}

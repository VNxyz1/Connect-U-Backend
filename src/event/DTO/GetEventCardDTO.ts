import { ApiProperty } from '@nestjs/swagger';
import { EventtypeEnum } from '../../database/enums/EventtypeEnum';
import { IsBoolean, IsISO8601, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { StatusEnum } from '../../database/enums/StatusEnum';
import { GetCategoryDTO } from '../../category/DTO/GetCategoryDTO';
import { Type } from 'class-transformer';

export class GetEventCardDTO
{
  @ApiProperty({ description: 'the ID of the event', example: 1 })
  id: string;

  @ApiProperty({ type: [GetCategoryDTO] })
  @ValidateNested({ each: true })
  @Type(() => GetCategoryDTO)
  categories: GetCategoryDTO[];

  @ApiProperty({
    description: 'Datum und Uhrzeit des Events',
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
    description: 'Hausnummer des Veranstaltungsortes',
    required: false,
    example: '123',
  })
  @IsString()
  streetNumber?: string;

  @ApiProperty({
    description: 'Straßenname des Veranstaltungsortes',
    required: false,
    example: 'Hauptstraße',
  })
  @IsString()
  street?: string;

  @ApiProperty({
    description: 'Postleitzahl des Veranstaltungsortes',
    required: false,
    example: '12345',
  })
  @IsString()
  zipCode?: string;

  @ApiProperty({
    description: 'Stadt des Veranstaltungsortes',
    required: false,
    example: 'Berlin',
  })
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Anzahl der erlaubten Teilnehmer',
    example: 50,
  })
  @IsNumber()
  @IsNotEmpty()
  participantsNumber: number;
}

import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum SortOrder {
  NEWEST_FIRST = 'newestFirst',
  OLDEST_FIRST = 'oldestFirst',
  UPCOMING_NEXT = 'upcomingNext',
  UPCOMING_LAST = 'upcomingLast',
  ALPHABETICAL_ASC = 'alphabetical_asc',
  ALPHABETICAL_DESC = 'alphabetical_desc',
}

export class FilterDTO {
  @ApiPropertyOptional({
    description: 'Sort events by different criteria',
    example: 'newestFirst',
    enum: SortOrder,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiPropertyOptional({
    description: 'Search for events by title',
    example: 'Music Festival',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Filter events by category IDs',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map(Number)
      : Number.isNaN(value)
        ? undefined
        : [Number(value)],
  )
  @IsNumber({}, { each: true })
  categories?: number[];

  @ApiPropertyOptional({
    description: 'Filter events by tags',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map(Number)
      : Number.isNaN(value)
        ? undefined
        : [Number(value)],
  )
  @IsNumber({}, { each: true })
  tags?: number[];

  @ApiPropertyOptional({
    description: 'The minimum age allowed for the event',
    example: '18',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @Min(0)
  minAge?: number;

  @ApiPropertyOptional({
    description: 'The maximum age allowed for the event',
    example: '35',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @Max(120)
  maxAge?: number;

  @ApiPropertyOptional({
    description: 'Allowed genders for the event (e.g., male, female, diverse)',
    example: [1, 3],
  })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map(Number)
      : Number.isNaN(value)
        ? undefined
        : [Number(value)],
  )
  @IsArray()
  @ArrayMinSize(1, { message: 'You have to select at least one gender' })
  @IsNumber({}, { each: true })
  genders?: number[];

  @ApiPropertyOptional({
    description: 'Whether the event is public',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the event is half public',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isHalfPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the event is online',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isOnline?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the event is in a physical location',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isInPlace?: boolean;

  @ApiPropertyOptional({
    description: 'Filter events by multiple dates (ISO 8601 format)',
    example: ['2025-01-15', '2025-01-20'],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : [value],
  )
  @IsDateString({}, { each: true })
  dates?: string[];

  @ApiPropertyOptional({
    description: 'Filter events by cities',
    example: ['35390', '61200'],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map(Number)
      : Number.isNaN(value)
        ? undefined
        : [Number(value)],
  )
  @IsNumber({}, { each: true })
  cities?: number[];
}

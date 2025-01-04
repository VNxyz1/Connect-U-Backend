import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  Min,
  Max, IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum SortOrder {
  NEWEST_FIRST = 'newestFirst',
  OLDEST_FIRST = 'oldestFirst',
  UPCOMING_NEXT = 'upcomingNext',
  UPCOMING_LAST = 'upcomingLast',
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
    example: ['male', 'female'],
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? [value] : Array.isArray(value) ? value : undefined,
  )
  @IsOptional()
  genders?: string[];

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
}

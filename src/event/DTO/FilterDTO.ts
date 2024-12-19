import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterEventDTO {
  @ApiPropertyOptional({
    description: 'Search for events by title',
    example: 'Music Festival',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'The minimum age allowed for the event',
    example: 18,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAge?: number;

  @ApiPropertyOptional({
    description: 'The maximum age allowed for the event',
    example: 35,
  })
  @IsOptional()
  @IsNumber()
  @Max(120)
  maxAge?: number;

  @ApiPropertyOptional({
    description: 'Allowed genders for the event (e.g., male, female, diverse',
    example: ['male', 'female'],
  })
  @IsOptional()
  genders?: string[];

  @ApiPropertyOptional({
    description: 'Whether the event is public',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the event is half public',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isHalfPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the event is online',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the event is in a physical location',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isInPlace?: boolean;
}

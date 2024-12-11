import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDTO {
  @ApiProperty({
    description: 'The pronouns of the user',
    example: 'she/her',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Pronouns must not exceed 30 characters' })
  pronouns?: string;

  @ApiProperty({
    description: 'The profile description',
    example:
      'Live, Love, Laugh ❤️ ' +
      'Ich liebe es, mit Freunden spazieren zu gehen und die Natur zu genießen 🍃',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000, {
    message: 'Profile description must not exceed 2000 characters',
  })
  profileText?: string;

  @ApiProperty({
    description: 'An array of tags for the user',
    example: ['funny', 'adventurous'],
    type: [String],
  })
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

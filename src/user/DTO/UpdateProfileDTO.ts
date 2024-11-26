import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateProfileDTO {
  @ApiProperty({
    description: 'The pronouns of the user',
    example: 'she/her',
    nullable: true,
  })
  @IsString()
  @IsOptional()
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
  profileText?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

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
}

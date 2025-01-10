import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class GetFriendProfileDTO {
  @ApiProperty({ description: 'the ID of the user', example: '2' })
  id: string;

  @ApiProperty({
    description: 'checks if current user is the one visiting the profile',
    example: false,
  })
  isUser: boolean;

  @ApiProperty({
    description: 'checks if the current user is friends with the other user',
    example: false,
  })
  areFriends: boolean;

  @ApiProperty({ description: 'the first name of the user', example: 'Lina' })
  firstName: string;

  @ApiProperty({ description: 'the username of the user', example: 'linaek' })
  username: string;

  @ApiProperty({
    description: 'the city, where the user lives',
    example: 'Gießen',
  })
  city: string;

  @ApiProperty({
    description: 'the pronouns of the user',
    example: 'empty.png',
  })
  profilePicture: string;

  @ApiProperty({ description: 'the pronouns of the user', example: 'she/her' })
  pronouns: string;

  @ApiProperty({ description: 'the age of the user', example: 23 })
  age: number;

  @ApiProperty({
    description: 'the profile description',
    example:
      'Live, Love, Laugh ❤️ ' +
      'Ich liebe es, mit Freunden spazieren zu gehen und die Natur zu genießen 🍃',
  })
  profileText: string;

  @ApiProperty({
    description: 'Array of tags associated with the user',
    example: ['chillGirl', 'random'],
    type: [String],
    nullable: true,
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

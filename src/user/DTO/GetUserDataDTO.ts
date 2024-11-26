import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum } from '../../database/enums/GenderEnum';

export class GetUserDataDTO {
  @ApiProperty({ description: 'The ID of the user', example: '2' })
  id: string;

  @ApiProperty({ description: 'The first name of the user', example: 'Lina' })
  firstName: string;

  @ApiProperty({ description: 'The last name of the user', example: 'Erik' })
  lastName: string;

  @ApiProperty({ description: 'The username of the user', example: 'linaek' })
  username: string;

  @ApiProperty({
    description: 'The e-mail of the user',
    example: 'linaek@linaek.com',
  })
  email: string;

  @ApiProperty({
    description: 'The city where the user lives',
    example: 'Gießen',
  })
  city: string;

  @ApiProperty({
    description: 'The street number of the users address',
    example: '123',
    nullable: true,
  })
  streetNumber: string;

  @ApiProperty({
    description: 'The users date of birth',
    example: '1995-06-15',
    type: 'string',
    format: 'date',
  })
  birthday: string;

  @ApiProperty({
    description: 'The gender of the user',
    example: 3,
    enum: ['Male', 'Female', 'Diverse'],
  })
  gender: GenderEnum;

  @ApiProperty({
    description: 'The street name of the users address',
    example: 'Main Street',
    nullable: true,
  })
  street: string;

  @ApiProperty({
    description: 'The zip code of the users address',
    example: '35390',
    nullable: true,
  })
  zipCode: string;
}

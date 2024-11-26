import {
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDataDTO {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'Lina',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'First name cannot contain only whitespace' })
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Erik',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Last name cannot contain only whitespace' })
  lastName: string;

  @ApiProperty({
    description: 'The username of the user',
    example: 'linaek',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Username cannot contain only whitespace' })
  username: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'linaek@linaek.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Matches(/\S/, { message: 'Email cannot contain only whitespace' })
  email: string;

  @ApiProperty({
    description: 'The city where the user lives',
    example: 'Gießen',
  })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({
    description: 'The street number of the users address',
    example: '123',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  streetNumber?: string;

  @ApiProperty({
    description: 'The user\'s date of birth',
    example: '1995-06-15',
  })
  @IsISO8601()
  @IsNotEmpty()
  birthday: string;

  @ApiProperty({
    description: 'The street name of the users address',
    example: 'Main Street',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({
    description: 'The zip code of the users address',
    example: '35390',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  zipCode?: string;
}

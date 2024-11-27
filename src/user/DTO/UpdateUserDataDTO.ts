import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDataDTO {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'Lina',
  })
  @IsString()
  @IsOptional()
  @Matches(/\S/, { message: 'First name cannot contain only whitespace' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName?: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Erik',
  })
  @IsString()
  @IsOptional()
  @Matches(/\S/, { message: 'Last name cannot contain only whitespace' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName?: string;

  @ApiProperty({
    description: 'The username of the user',
    example: 'linaek',
  })
  @IsString()
  @IsOptional()
  @Matches(/\S/, { message: 'Username cannot contain only whitespace' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  username?: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'linaek@linaek.com',
  })
  @IsString()
  @IsOptional()
  @IsEmail()
  @Matches(/\S/, { message: 'Email cannot contain only whitespace' })
  email?: string;

  @ApiProperty({
    description: 'The city where the user lives',
    example: 'Gießen',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'City name must not exceed 100 characters' })
  city?: string;

  @ApiProperty({
    description: 'The street number of the users address',
    example: '123',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(6, { message: 'Street number must not exceed 6 characters' })
  streetNumber?: string;

  @ApiProperty({
    description: 'The users date of birth',
    example: '1995-06-15',
  })
  @IsISO8601()
  @IsOptional()
  birthday?: string;

  @ApiProperty({
    description: 'The street name of the users address',
    example: 'Main Street',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Street name must not exceed 100 characters' })
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

import {
  IsBoolean,
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum } from '../../database/enums/GenderEnum';

export class CreateUserDTO {
  @ApiProperty({
    description: 'Check if AGB is True',
  })
  @IsBoolean()
  agb: boolean;

  @ApiProperty({
    description: 'The email of the user',
    example: 'test@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Matches(/\S/, { message: 'Email cannot contain only whitespace' })
  email: string;

  @ApiProperty({
    description: 'The username of the user',
    example: 'testUser',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/\S/, { message: 'Username cannot contain only whitespace' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  username: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'Passwort1234',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Approve the password of the user',
    example: 'Passwort1234',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  passwordConfirm: string;

  @ApiProperty({
    description: 'The first name of the user',
    example: 'firstName',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'First name cannot contain only whitespace' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'lastName',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Last name cannot contain only whitespace' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @ApiProperty({
    description: 'The birthday of the user',
    example: '2002-08-06',
  })
  @IsISO8601()
  @IsNotEmpty()
  birthday: string;

  @ApiProperty({
    description: 'The gender of the user',
    example: 2,
  })
  @IsNotEmpty()
  gender: GenderEnum;
}

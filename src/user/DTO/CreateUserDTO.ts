import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
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
  email: string;

  @ApiProperty({
    description: 'The username of the user',
    example: 'testUser',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Approve of the email of the user',
    example: 'test@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  emailConfirm: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'Passwort1234',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Approve the password of the user',
    example: 'Passwort1234',
  })
  @IsString()
  @IsNotEmpty()
  passwordConfirm: string;

  @ApiProperty({
    description: 'The first name of the user',
    example: 'firstName',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'lastName',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'The birthday of the user',
    example: '08.06.2002',
  })
  @IsDate()
  @IsNotEmpty()
  birthday: string;

  @ApiProperty({
    description: 'The gender of the user',
    example: 2,
  })
  @IsDate()
  @IsNotEmpty()
  gender: GenderEnum;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '1234567890',
  })
  @IsString()
  @Matches(/^[+]?\d{1,3}?[-\s.]?\d{3,14}[-\s.]?\d{3,14}$/, {
    message: 'Invalid phone number',
  })
  phoneNumber: string;
}

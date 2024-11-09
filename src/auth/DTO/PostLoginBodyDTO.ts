import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PostLoginBodyDTO {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'Passwort1234',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

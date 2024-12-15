import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateListDTO {
  @ApiProperty({
    description: 'The title of the list',
    example: 'Grocery List',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  @Matches(/\S/, {
    message: 'Title must not be empty or contain only whitespace',
  })
  title: string;

  @ApiProperty({
    description: 'The description of the list',
    example: 'Items needed for the event',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string;
}

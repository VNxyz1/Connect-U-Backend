import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateListDTO {
  @ApiProperty({
    description: 'The title of the list',
    example: 'Grocery List',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
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

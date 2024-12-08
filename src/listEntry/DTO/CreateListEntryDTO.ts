import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateListEntryDTO {
  @ApiProperty({
    description: 'The content of the list entry',
    example: 'Buy milk',
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(255, { message: 'Content must not exceed 255 characters' })
  content: string;
}

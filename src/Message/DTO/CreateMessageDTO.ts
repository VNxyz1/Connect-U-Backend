import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateMessageDTO {
  @ApiProperty({
    description: 'The message',
    example: 'Hallo ihr Lieben!!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(65000, { message: 'Content must not exceed 65000 characters' })
  @Matches(/\S/, {
    message: 'Content must not be empty or contain only whitespace',
  })
  @Matches(/^(?!.*https?:\/\/).+$/, {
    message: 'Messages cannot contain links',
  })
  content: string;
}

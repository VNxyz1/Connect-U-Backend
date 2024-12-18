import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateProfilePicDTO {
  @ApiProperty({
    description: 'The Base64-encoded profile picture string',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAB4AAAAJ...'
  })
  @IsString({ message: 'Profile picture must be a string' })
  @IsNotEmpty({ message: 'Profile picture is required' })
  @Matches(/^data:image\/(jpeg|png|jpg);base64,[A-Za-z0-9+/]+={0,2}$/, {
    message: 'Invalid Base64 image format',
  })
  profilePicture: string;
}

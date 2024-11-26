import { ApiProperty } from '@nestjs/swagger';
import {
  IsString, MinLength,
} from 'class-validator';

export class UpdatePasswordDTO {
  @ApiProperty({
    description: 'The old password',
    example: 'Password1234',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'The new password',
    example: 'Password5678',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({
    description: 'The new password confirmed',
    example: 'Password5678',
  })
  @IsString()
  @MinLength(8)
  newPasswordConfirm: string;
}

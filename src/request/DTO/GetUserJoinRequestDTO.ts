import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { GetUserProfileDTO } from '../../user/DTO/GetUserProfileDTO';

export class GetUserJoinRequestDTO {
  @ApiProperty({ description: 'the ID of the request', example: 1 })
  id: number;

  @ApiProperty({
    description: 'bool if request was denied',
    example: false,
  })
  @IsNotEmpty()
  denied: boolean;

  @ApiProperty({ type: GetUserProfileDTO })
  @Type(() => GetUserProfileDTO)
  user: GetUserProfileDTO;
}

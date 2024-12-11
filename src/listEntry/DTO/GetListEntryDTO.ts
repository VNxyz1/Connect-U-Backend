import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { GetUserProfileDTO } from '../../user/DTO/GetUserProfileDTO';

export class GetListEntryDTO {
  @ApiProperty({ description: 'The ID of the list entry', example: 1 })
  id: number;

  @ApiProperty({
    description: 'The timestamp when the entry was created',
    example: '2023-12-01T15:30:00.000Z',
  })
  @IsNotEmpty()
  timestamp: string;

  @ApiProperty({
    description: 'The content of the list entry',
    example: 'Bring snacks for the event',
  })
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'The user assigned to this entry, if any',
    type: GetUserProfileDTO,
    nullable: true,
  })
  @IsOptional()
  @Type(() => GetUserProfileDTO)
  user?: GetUserProfileDTO;
}

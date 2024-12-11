import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserProfileDTO } from '../../user/DTO/GetUserProfileDTO';
import { GetListEntryDTO } from '../../listEntry/DTO/GetListEntryDTO';

export class GetListDetailsDTO {
  @ApiProperty({ description: 'The ID of the list', example: 1 })
  id: number;

  @ApiProperty({
    description: 'The title of the list',
    example: 'Grocery List',
  })
  title: string;

  @ApiProperty({
    description: 'The description of the list',
    example: 'Items needed for the upcoming event',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'The creator of the list',
    type: GetUserProfileDTO,
  })
  @Type(() => GetUserProfileDTO)
  creator: GetUserProfileDTO;

  @ApiProperty({
    description: 'All entries in the list',
    type: [GetListEntryDTO],
  })
  @Type(() => GetListEntryDTO)
  listEntries: GetListEntryDTO[];
}

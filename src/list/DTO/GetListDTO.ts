import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GetUserProfileDTO } from '../../user/DTO/GetUserProfileDTO';

export class GetListDTO {
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
    description: 'The number of list items',
    example: 4,
  })
  listEntriesNumber: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class GetCategoryDTO {
  @ApiProperty({ description: 'the ID of the category', example: 1 })
  id: number;

  @ApiProperty({ description: 'the name of the category', example: 'Party' })
  name: string;
}

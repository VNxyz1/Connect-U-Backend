import { ApiProperty } from '@nestjs/swagger';

export class GetTagDTO {
  @ApiProperty({
    description: 'The title of the tag',
    example: 'Sports',
  })
  title: string;
}

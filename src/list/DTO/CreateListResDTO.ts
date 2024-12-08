import { ApiProperty } from '@nestjs/swagger';

export class CreateListResDTO {
  @ApiProperty()
  ok: boolean;
  @ApiProperty()
  message: string;
  @ApiProperty()
  listId: number;
  constructor(ok: boolean, message: string, listId: number) {
    this.ok = ok;
    this.message = message;
    this.listId = listId;
  }
}

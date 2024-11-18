import { ApiProperty } from '@nestjs/swagger';

export class CreateEventResDTO {
  @ApiProperty()
  ok: boolean;
  @ApiProperty()
  message: string;
  @ApiProperty()
  eventId: string;
  constructor(ok: boolean, message: string, eventId: string) {
    this.ok = ok;
    this.message = message;
    this.eventId = eventId;
  }
}

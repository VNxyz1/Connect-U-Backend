import { ApiProperty } from '@nestjs/swagger';

export class CheckLoginRes {
  @ApiProperty({
    description:
      'Is true if the user has an active refresh token saved in his cookies',
    example: 'true',
  })
  loggedIn: boolean;

  constructor(isLoggedIn: boolean) {
    this.loggedIn = isLoggedIn;
  }
}

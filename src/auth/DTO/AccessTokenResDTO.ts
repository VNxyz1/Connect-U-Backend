import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResDTO {
  @ApiProperty({
    description: 'The Access Token, used for authentication',
    example:
      'rvwetvwetwerwer435345v45v436lkj3nh6j43b5b2job5oi23b4bo23bo4b23ob423b4o1bnpk4n23pknp23',
  })
  access_token: string;

  constructor(access_token: string) {
    this.access_token = access_token;
  }
}

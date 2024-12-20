import { ApiProperty } from '@nestjs/swagger';

export class GetInviteLinkDTO {
  @ApiProperty({
    description:
      'The invite link. After the host address, the link looks like this: `add-friend/<username>/<uuid>` ',
    example:
      'https://www.example.com/add-friend/VNxyz/c56417ef-ce42-4149-9a63-a57b55f9796e',
    type: 'string',
  })
  inviteLink: string;

  @ApiProperty({
    description: 'The time the link will be active in ms',
    example: '300000',
    type: 'number',
  })
  ttl: number;
}

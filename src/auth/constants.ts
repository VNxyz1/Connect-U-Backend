import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type JwtConstants = {
  secret: string;
};

@Injectable()
export class JWTConstants {
  constructor(private readonly configService: ConfigService) {}

  getConstants(): JwtConstants {
    return {
      secret: this.configService.get<string>('JWT_SECRET'),
    };
  }
}

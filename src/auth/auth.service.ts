import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenPayload, JWTConstants, RefreshTokenPayload } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
    private jwtConstants: JWTConstants,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userService.findByEmail(email);

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new UnauthorizedException();
    }

    const payloadAuth: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const payloadRefresh: RefreshTokenPayload = {
      sub: user.id,
      username: user.username,
    };
    return {
      access_token: await this.jwtService.signAsync(payloadAuth),
      refresh_token: await this.jwtService.signAsync(payloadRefresh, {
        expiresIn: '7d',
      }),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
  }> {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.jwtConstants.getConstants().secret,
      });
      const user = await this.userService.findById(payload.sub);
      const newPayload: AuthTokenPayload = {
        sub: user.id,
        email: user.email,
        username: user.username
      }
      return {
        access_token: await this.jwtService.signAsync(newPayload),
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token', e);
    }
  }
}

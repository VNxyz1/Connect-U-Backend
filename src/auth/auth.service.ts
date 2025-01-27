import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import {
  AuthTokenPayload,
  JWTConstants,
  RefreshTokenPayload,
} from './constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
    private jwtConstants: JWTConstants,
  ) {}

  async validatePassword(password: string, userPassword: string) {
    return await bcrypt.compare(password, userPassword);
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userService.findByEmail(email);

    const valid = await this.validatePassword(password, user.password);

    if (!valid) {
      throw new NotFoundException(
        'A user with these login credentials is not known.',
      );
    }

    const payloadAuth: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const payloadRefresh: RefreshTokenPayload = {
      userId: user.id,
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
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.jwtConstants.getConstants().secret,
        },
      );
      const user = await this.userService.findById(payload.userId);
      const newPayload: AuthTokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
      };
      return {
        access_token: await this.jwtService.signAsync(newPayload),
      };
    } catch (e) {
      throw new BadRequestException('Invalid refresh token', e);
    }
  }

  async decodeToken<T>(token: string): Promise<T> {
    return this.jwtService.decode<T>(token);
  }

  extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

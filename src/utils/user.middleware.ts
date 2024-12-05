import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenPayload, JWTConstants } from '../auth/constants';

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly jwtConstants: JWTConstants,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies['refresh_token'];
    if (!token) {
      res['user'] = null;
    } else {
      try {
        const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
          token,
          {
            secret: this.jwtConstants.getConstants().secret,
          },
        );
        req['user'] = await this.userService.findById(payload.userId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        res['user'] = null;
      }
    }
    next();
  }
}

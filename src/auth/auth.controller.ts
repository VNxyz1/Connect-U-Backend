import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { PostLoginBodyDTO } from './DTO/PostLoginBodyDTO';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Request, Response } from 'express';
import * as process from 'node:process';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: PostLoginBodyDTO, @Res() res: Response) {
    const tokens = await this.authService.signIn(body.email, body.password);
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: !process.env.API_CORS || process.env.API_CORS != '1',
      sameSite:
        !process.env.API_CORS || process.env.API_CORS != '1' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({access_token: tokens.access_token});
  }

  @HttpCode(HttpStatus.OK)
  @Get('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    return await this.authService.refreshAccessToken(refreshToken);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile() {
    return { waaahhh: 'riooooo' };
  }
}

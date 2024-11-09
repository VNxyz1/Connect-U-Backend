import {
  Body,
  Controller,
  Delete,
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
import { Request, Response } from 'express';
import * as process from 'node:process';
import { OkDTO } from '../serverDTO/OkDTO';
import { AuthGuard } from './auth.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
    type: OkDTO,
    description: 'Logs in a user',
    status: HttpStatus.OK,
  })
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
    res.json({ access_token: tokens.access_token });
  }

  @ApiResponse({
    description: 'refreshes the access token ',
    status: HttpStatus.OK,
  })
  @HttpCode(HttpStatus.OK)
  @Get('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    return await this.authService.refreshAccessToken(refreshToken);
  }

  @ApiResponse({
    type: OkDTO,
    description: 'Logs out a user',
    status: HttpStatus.OK,
  })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('logout')
  async logout(@Res() res: Response) {
    res
      .clearCookie('refresh_token')
      .send(new OkDTO(true, 'User is logged out.'));
  }
}

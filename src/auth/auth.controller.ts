import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PostLoginBodyDTO } from './DTO/PostLoginBodyDTO';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { OkDTO } from '../serverDTO/OkDTO';
import { ApiBadRequestResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { AccessTokenResDTO } from './DTO/AccessTokenResDTO';
import { CheckLoginRes } from './DTO/CheckLoginRes';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({
    description: 'Logs in a user',
    status: HttpStatus.OK,
    type: AccessTokenResDTO,
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: PostLoginBodyDTO, @Res() res: Response) {
    const tokens = await this.authService.signIn(body.email, body.password);
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: !JSON.parse(process.env.API_CORS ?? 'false'),
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(new AccessTokenResDTO(tokens.access_token));
  }

  @ApiResponse({
    description: 'gets the access token',
    status: HttpStatus.OK,
    type: AccessTokenResDTO,
  })
  @ApiBadRequestResponse({
    description: 'Returns, when the `refresh_token` cookie does not exist',
    status: HttpStatus.BAD_REQUEST,
  })
  @HttpCode(HttpStatus.OK)
  @Get('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new BadRequestException('Refresh token missing');
    }

    try {
      const token = await this.authService.refreshAccessToken(refreshToken);
      res.status(HttpStatus.OK).json(token);
    } catch (error) {
      res
        .clearCookie('refresh_token')
        .status(HttpStatus.BAD_REQUEST)
        .json(error);
    }
  }

  @ApiResponse({
    description: 'Checks the login status',
    status: HttpStatus.OK,
    type: CheckLoginRes,
  })
  @HttpCode(HttpStatus.OK)
  @Get('check-login')
  async checkLogin(@Req() req: Request) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      return new CheckLoginRes(false);
    }

    return new CheckLoginRes(true);
  }

  @ApiResponse({
    type: OkDTO,
    description:
      'Logs out a user. The Authtoken has to be deleted in the frontend, when this response is successful.',
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

import { UserService } from './user.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { CreateUserDTO } from './DTO/CreateUserDTO';
import { OkDTO } from '../serverDTO/OkDTO';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { Response } from 'express';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    public readonly userService: UserService,
    public readonly utils: UtilsService,
    public readonly authService: AuthService,
  ) {}

  @ApiResponse({
    type: OkDTO,
    description: 'Creates a new user',
    status: HttpStatus.CREATED,
  })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createUser(@Body() body: CreateUserDTO, @Res() res: Response) {
    if (!body.agb) {
      throw new BadRequestException(
        'You must accept the terms and conditions to register',
      );
    }
    if (body.password !== body.passwordConfirm) {
      throw new BadRequestException('Passwords must match');
    }
    const birthday = new Date(body.birthday);
    if (!this.utils.validateUserAge(birthday, 16)) {
      throw new BadRequestException(
        'You must be at least 16 years old to register.',
      );
    }

    await this.userService.createUser(body);

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
}

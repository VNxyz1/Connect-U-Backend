import { UserService } from './user.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDTO } from './DTO/CreateUserDTO';
import { OkDTO } from '../serverDTO/OkDTO';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { Response } from 'express';
import { GetUserProfileDTO } from './DTO/GetUserProfileDTO';
import { GetUserDataDTO } from './DTO/GetUserDataDTO';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../utils/user.decorator';
import { UserDB } from '../database/UserDB';
import { UpdateUserDataDTO } from './DTO/UpdateUserDataDTO';
import { UpdateProfileDTO } from './DTO/UpdateProfileDTO';
import { UpdatePasswordDTO } from './DTO/UpdatePasswordDTO';
import { TagService } from '../tag/tag.service';
import * as fs from 'node:fs';
import { CreateProfilePicDTO } from './DTO/CreateProfilePicDTO';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    public readonly userService: UserService,
    public readonly utils: UtilsService,
    public readonly authService: AuthService,
    public readonly utilsService: UtilsService,
    public readonly tagService: TagService,
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

  @ApiResponse({
    type: GetUserProfileDTO,
    description: 'gets data for the profile',
  })
  @Get('/userProfile/:userId')
  async getUserProfile(
    @Param('userId') userId: string,
    @User() user: UserDB | null,
  ): Promise<GetUserProfileDTO> {
    const userProfile = await this.userService.findById(userId);
    const isUser = user?.id === userProfile.id;
    return this.utilsService.transformUserDBtoGetUserProfileDTO(
      userProfile,
      isUser,
    );
  }

  @ApiResponse({
    type: GetUserDataDTO,
    description: 'gets user Data for editing the user',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Get('/userData')
  async getUserData(@User() user: UserDB): Promise<GetUserDataDTO> {
    return this.utilsService.transformUserDBtoGetUserDataDTO(user);
  }

  @ApiResponse({
    type: OkDTO,
    description: 'Updates a users data',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('/userData')
  async updateUser(
    @Body() body: UpdateUserDataDTO,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    await this.userService.updateUser(user.id, body);
    return new OkDTO(true, 'user data was updated successfully');
  }

  @ApiResponse({
    type: OkDTO,
    description: 'Updates a users profile',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('/userProfile')
  async updateProfile(
    @Body() body: UpdateProfileDTO,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    let tags = [];
    if (body.tags) {
      tags = await this.tagService.findOrCreateTags(body.tags);
    }

    await this.userService.updateUserProfile(user.id, tags, body);
    return new OkDTO(true, 'user profile was updated successfully');
  }

  @ApiResponse({
    type: OkDTO,
    description: 'Updates a users password',
    status: HttpStatus.OK,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'New password and password confirmation do not match',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Old password is incorrect',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('/password')
  async updatePassword(
    @Body() body: UpdatePasswordDTO,
    @User() user: UserDB,
  ): Promise<OkDTO> {
    if (body.newPassword !== body.newPasswordConfirm) {
      throw new BadRequestException(
        'New password and password confirmation must match',
      );
    }
    const valid = await this.authService.validatePassword(
      body.oldPassword,
      user.password,
    );

    if (!valid) {
      throw new NotFoundException('Old password does not match');
    }

    await this.userService.updatePassword(user.id, body.newPassword);
    return new OkDTO(true, 'password was updated successfully');
  }

  @Post('upload-profile-picture')
  async uploadProfilePicture(
    @Body('profilePicture') body: CreateProfilePicDTO,
    @User() user: UserDB,
  ) {

    const buffer = Buffer.from(body.profilePicture, 'base64');
    const fileName = `${user.id}-${Date.now()}.png`;
    const filePath = `./uploads/profilePictures/${fileName}`;

    await fs.promises.writeFile(filePath, buffer);

    await this.userService.updateProfilePic(user.id, fileName);

    return new OkDTO(true, 'Profile Picture Upload successful');
  }
}

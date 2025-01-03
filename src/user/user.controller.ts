import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDTO } from './DTO/CreateUserDTO';
import { OkDTO } from '../serverDTO/OkDTO';
import { UtilsService } from '../utils/utils.service';
import { AuthService } from '../auth/auth.service';
import { Response, Request } from 'express';
import { extname, join } from 'path';
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
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetInviteLinkDTO } from './DTO/GetInviteLinkDTO';
import { FriendService } from '../friend/friend.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    public readonly userService: UserService,
    public readonly utils: UtilsService,
    public readonly authService: AuthService,
    public readonly utilsService: UtilsService,
    public readonly tagService: TagService,
    public readonly friendService: FriendService,
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

  @ApiResponse({
    type: OkDTO,
    description: 'posts a profile picture for a specific user',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @Patch('profilePicture')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profilePictures',
        filename: (_req: any, file, callback) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          callback(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 5242880,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new Error('Invalid file type'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadProfilePicture(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^image/,
        })
        .addMaxSizeValidator({
          maxSize: 5242880,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @User() user: UserDB,
  ) {
    const currentProfilePic = user.profilePicture;

    await this.userService.updateProfilePic(user.id, file.filename);

    if (currentProfilePic && currentProfilePic !== 'empty.png') {
      const oldFilePath = `./uploads/profilePictures/${currentProfilePic}`;
      await fs.promises.unlink(oldFilePath);
    }

    return new OkDTO(true, 'Profile Picture Upload successful');
  }

  @ApiResponse({
    status: 200,
    description: 'Successfully fetched the profile picture',
    content: {
      'image/png': {
        example: 'Profile picture image file',
      },
      'image/jpeg': {
        example: 'Profile picture image file',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Profile picture not found',
  })
  @ApiParam({
    name: 'image',
    description: 'The filename of the profile picture to fetch',
    example: 'profile123.png',
  })
  @Get('profilePicture/:image')
  async getImage(@Param('image') image: string, @Res() res: Response) {
    const imgPath: string = join(
      process.cwd(),
      'uploads',
      'profilePictures',
      image,
    );
    if (!fs.existsSync(imgPath)) {
      return res.status(404).json({
        message: 'Profile picture not found',
      });
    }
    res.sendFile(imgPath);
  }

  @ApiResponse({
    type: OkDTO,
    description: 'Deletes a users profile picture',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('/profilePicture')
  async deleteProfilePicture(@User() user: UserDB) {
    const currentProfilePic = user.profilePicture;

    const fileName = 'empty.png';

    await this.userService.updateProfilePic(user.id, fileName);

    if (currentProfilePic && currentProfilePic !== 'empty.png') {
      const oldFilePath = `./uploads/profilePictures/${currentProfilePic}`;
      await fs.promises.unlink(oldFilePath);
    }

    return new OkDTO(true, 'Deleting profile picture was successful');
  }

  @ApiResponse({
    type: GetInviteLinkDTO,
    description:
      'returns an invite link, that can be used to add the user to some other users friends list. the link is valid for 5 minutes.',
    status: HttpStatus.OK,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Get('inviteLink')
  async getInviteLink(@Req() req: Request, @User() user: UserDB) {
    const uuid = crypto.randomUUID();
    const host: string = process.env.FRONTEND_URL || req.get('host');
    const link = this.friendService.createInviteLink(
      req.protocol,
      host,
      user.username,
      uuid,
    );

    const ttl = 5 * 60 * 1000;

    this.friendService.setInviteLink(user.username, uuid, ttl);

    const res = new GetInviteLinkDTO();
    res.inviteLink = link;
    res.ttl = ttl;

    return res;
  }
}

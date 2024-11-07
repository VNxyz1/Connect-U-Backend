import { UserService } from './user.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { CreateUserDTO } from './DTO/CreateUserDTO';
import { OkDTO } from '../serverDTO/OkDTO';
import { UtilsService } from '../utils/utils.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    public readonly userService: UserService,
    public readonly utils: UtilsService,
  ) {}

  @ApiResponse({ type: OkDTO, description: 'Creates a new user' })
  @Post()
  async createUser(@Body() body: CreateUserDTO) {
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
    return new OkDTO(true, 'User was created');
  }
}

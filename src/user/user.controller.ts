import { UserService } from './user.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { CreateUserDTO } from './DTO/CreateUserDTO';
import { OkDTO } from '../serverDTO/OkDTO';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(public readonly userService: UserService) {}

  private isUser16(birthday: Date): boolean {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDifference = today.getMonth() - birthday.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthday.getDate())
    ) {
      age--;
    }
    return age >= 16;
  }
  @ApiResponse({ type: OkDTO, description: 'Creates a new user' })
  @Post()
  async createUser(@Body() body: CreateUserDTO) {
    if (!body.agb) {
      throw new BadRequestException(
        'You must accept the terms and conditions to register',
      );
    }
    if (body.password.trim().length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }
    if (body.password !== body.passwordConfirm) {
      throw new BadRequestException('Passwords must match');
    }
    const birthday = new Date(body.birthday);
    if (!this.isUser16(birthday)) {
      throw new BadRequestException(
        'You must be at least 16 years old to register.',
      );
    }
    try {
      await this.userService.createUser(body);
      return new OkDTO(true, 'User was created');
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the user',
      );
    }
  }
}

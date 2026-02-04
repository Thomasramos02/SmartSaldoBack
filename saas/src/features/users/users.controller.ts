import {
  Controller,
  Get,
  Patch,
  Delete,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PassportJwtGuard } from '../auth/guards/passport-jwt.guard';
import { UsersService } from './users.services';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';

@UseGuards(PassportJwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Request() req): Promise<UserProfileDto> {
    // req.user is populated by the PassportJwtGuard
    const userId = req.user.id as number;
    return this.usersService.findById(userId);
  }

  @Patch('me')
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.id as number;
    return this.usersService.update(userId, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteProfile(@Request() req) {
    const userId = req.user.id as number;
    return this.usersService.remove(userId);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@Request() req, @Body() dto: ChangeUserPasswordDto) {
    const userId = req.user.id as number;
    return this.usersService.changePassword(userId, dto);
  }
}

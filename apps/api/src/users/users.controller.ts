import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserSettingsDto } from './dto/user.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.users.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.users.updateProfile(userId, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    await this.users.deleteAccount(userId);
    return { message: 'Account deleted successfully.' };
  }

  @Get('me/settings')
  @ApiOperation({ summary: 'Get user settings' })
  getSettings(@CurrentUser('id') userId: string) {
    return this.users.getSettings(userId);
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Update user settings' })
  updateSettings(@CurrentUser('id') userId: string, @Body() dto: UpdateUserSettingsDto) {
    return this.users.updateSettings(userId, dto);
  }
}

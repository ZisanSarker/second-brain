import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './services/notifications.service';
import { UpdateNotificationSettingDto } from './dto/notifications.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser('id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationsService.list(userId, {
      unreadOnly: unreadOnly === 'true',
      type,
      limit,
      offset,
    });
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService
      .list(userId, { unreadOnly: true, limit: 0 })
      .then((r) => ({ count: r.unreadCount }));
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @Get('settings')
  getSettings(@CurrentUser('id') userId: string) {
    return this.notificationsService.getSettings(userId);
  }

  @Patch('settings/:type')
  updateSetting(
    @CurrentUser('id') userId: string,
    @Param('type') type: string,
    @Body() dto: UpdateNotificationSettingDto,
  ) {
    return this.notificationsService.updateSetting(userId, type, dto);
  }
}

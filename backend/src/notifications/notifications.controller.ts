import { Controller, Get, Patch, Param, UseGuards, Request, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Request() req) {
    const userId = req.user?.id || req.user?.sub;
    return this.notificationsService.getNotifications(userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user?.id || req.user?.sub;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.notificationsService.markNotificationAsRead(id);
    return { success: true };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    const userId = req.user?.id || req.user?.sub;
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }
}

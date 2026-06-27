import { Controller, Get, Patch, Delete, Post, Param, UseGuards, Request, Body, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.notificationsService.getNotificationsPaginated(userId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
      search,
      filter,
    });
  }

  @Get('summary')
  async getSummary(@Request() req) {
    const userId = req.user?.id || req.user?.sub;
    return this.notificationsService.getSummary(userId);
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

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    const userId = req.user?.id || req.user?.sub;
    await this.notificationsService.deleteNotification(id, userId);
    return { success: true };
  }

  @Post('delete-multiple')
  async deleteMultiple(@Request() req, @Body() body: { ids: string[] }) {
    const userId = req.user?.id || req.user?.sub;
    await this.notificationsService.deleteMultiple(body.ids, userId);
    return { success: true };
  }

  @Post('clear-read')
  async clearRead(@Request() req) {
    const userId = req.user?.id || req.user?.sub;
    await this.notificationsService.clearRead(userId);
    return { success: true };
  }
}

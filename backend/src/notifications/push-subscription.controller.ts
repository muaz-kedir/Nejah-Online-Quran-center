import { Controller, Post, Delete, Body, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushSubscriptionService } from './push-subscription.service';

@Controller('push-subscriptions')
@UseGuards(JwtAuthGuard)
export class PushSubscriptionController {
  constructor(private readonly pushService: PushSubscriptionService) {}

  @Post()
  async subscribe(
    @Request() req,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    const userId = req.user.id || req.user.sub;
    return this.pushService.subscribe(userId, body);
  }

  @Delete()
  async unsubscribe(@Request() req, @Body() body: { endpoint: string }) {
    const userId = req.user.id || req.user.sub;
    await this.pushService.unsubscribe(userId, body.endpoint);
    return { success: true };
  }
}

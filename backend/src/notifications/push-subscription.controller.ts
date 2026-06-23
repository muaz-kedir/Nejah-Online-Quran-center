import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { PushSubscriptionService } from './push-subscription.service';

type SubscriptionBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

@Controller(['push-subscriptions', 'push-notifications'])
@UseGuards(JwtAuthGuard)
export class PushSubscriptionController {
  constructor(private readonly pushService: PushSubscriptionService) {}

  @Public()
  @Get('vapid-public-key')
  getVapidKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }

  @Post()
  async subscribe(
    @Request() req,
    @Body()
    body: {
      subscription?: SubscriptionBody;
      deviceInfo?: string;
      endpoint?: string;
      keys?: { p256dh: string; auth: string };
    },
  ) {
    return this.saveSubscription(req, body);
  }

  @Post('subscribe')
  async subscribeAlias(
    @Request() req,
    @Body()
    body: {
      subscription?: SubscriptionBody;
      deviceInfo?: string;
      endpoint?: string;
      keys?: { p256dh: string; auth: string };
    },
  ) {
    return this.saveSubscription(req, body);
  }

  private saveSubscription(
    req: { user: { id?: string; sub?: string; role?: string } },
    body: {
      subscription?: SubscriptionBody;
      deviceInfo?: string;
      endpoint?: string;
      keys?: { p256dh: string; auth: string };
    },
  ) {
    const userId = req.user.id || req.user.sub;
    const userType = req.user.role || 'user';
    const subscription = body.subscription || {
      endpoint: body.endpoint!,
      keys: body.keys!,
    };

    return this.pushService.subscribe(
      userId,
      userType,
      subscription,
      body.deviceInfo,
    );
  }

  @Delete()
  async unsubscribeDelete(@Request() req, @Body() body: { endpoint: string }) {
    return this.unsubscribe(req, body);
  }

  @Delete('unsubscribe')
  async unsubscribe(@Request() req, @Body() body: { endpoint: string }) {
    const userId = req.user.id || req.user.sub;
    await this.pushService.unsubscribe(userId, body.endpoint);
    return { success: true };
  }
}

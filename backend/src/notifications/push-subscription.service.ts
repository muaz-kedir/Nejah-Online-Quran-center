import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  icon?: string;
  badge?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
  renotify?: boolean;
}

@Injectable()
export class PushSubscriptionService {
  private readonly logger = new Logger(PushSubscriptionService.name);

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptionRepository: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT') || 'mailto:admin@nejah-center.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } else {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
    }
  }

  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<PushSubscription> {
    let existing = await this.subscriptionRepository.findOne({
      where: { userId, endpoint: subscription.endpoint },
    });

    if (existing) {
      existing.p256dh = subscription.keys.p256dh;
      existing.auth = subscription.keys.auth;
      return this.subscriptionRepository.save(existing);
    }

    const entity = this.subscriptionRepository.create({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    return this.subscriptionRepository.save(entity);
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.subscriptionRepository.delete({ userId, endpoint });
  }

  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    return this.subscriptionRepository.find({ where: { userId } });
  }

  async sendPush(userId: string, payload: PushPayload): Promise<void> {
    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify(payload);

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          pushPayload,
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          this.logger.warn(`Removing expired push subscription for user ${userId}`);
          await this.subscriptionRepository.delete(sub.id);
        } else {
          this.logger.error(`Failed to send push to user ${userId}: ${error.message}`);
        }
      }
    }
  }

  async sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    const subscriptions = await this.subscriptionRepository.find({
      where: userIds.map((id) => ({ userId: id })),
    });

    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify(payload);
    const grouped = new Map<string, PushSubscription[]>();

    for (const sub of subscriptions) {
      const list = grouped.get(sub.userId) || [];
      list.push(sub);
      grouped.set(sub.userId, list);
    }

    for (const [, subs] of grouped) {
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            pushPayload,
          );
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.subscriptionRepository.delete(sub.id);
          } else {
            this.logger.error(`Failed to send push: ${error.message}`);
          }
        }
      }
    }
  }
}

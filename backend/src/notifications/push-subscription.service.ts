import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
  icon?: string;
  badge?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
  renotify?: boolean;
}

@Injectable()
export class PushSubscriptionService implements OnModuleInit {
  private readonly logger = new Logger(PushSubscriptionService.name);
  private vapidConfigured = false;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptionRepository: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY')?.trim();
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY')?.trim();
    const subject = this.normalizeVapidSubject(
      this.configService.get<string>('VAPID_EMAIL') ||
        this.configService.get<string>('VAPID_SUBJECT'),
    );

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
      return;
    }

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log(`Web push configured (subject: ${subject})`);
    } catch (error: any) {
      this.logger.error(
        `Failed to configure VAPID — push notifications disabled: ${error.message}`,
      );
    }
  }

  /** web-push requires subject to be mailto:email or https:// URL */
  private normalizeVapidSubject(raw?: string): string {
    const fallback = 'mailto:admin@nejah-center.com';
    const value = raw?.trim();
    if (!value) return fallback;

    if (/^mailto:/i.test(value) || /^https?:\/\//i.test(value)) {
      return value;
    }

    if (value.includes('@')) {
      return `mailto:${value}`;
    }

    this.logger.warn(
      `VAPID_EMAIL/VAPID_SUBJECT is not a valid URL or email — using default subject`,
    );
    return fallback;
  }

  getVapidPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }

  isConfigured(): boolean {
    return this.vapidConfigured;
  }

  async subscribe(
    userId: string,
    userType: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    deviceInfo?: string,
  ): Promise<PushSubscription> {
    await this.subscriptionRepository.delete({ endpoint: subscription.endpoint });

    const existing = await this.subscriptionRepository.findOne({
      where: { userId, endpoint: subscription.endpoint },
    });

    if (existing) {
      existing.p256dh = subscription.keys.p256dh;
      existing.auth = subscription.keys.auth;
      existing.userType = userType;
      existing.deviceInfo = deviceInfo || existing.deviceInfo;
      return this.subscriptionRepository.save(existing);
    }

    const entity = this.subscriptionRepository.create({
      userId,
      userType,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      deviceInfo,
    });

    return this.subscriptionRepository.save(entity);
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.subscriptionRepository.delete({ userId, endpoint });
  }

  async removeByEndpoint(endpoint: string): Promise<void> {
    await this.subscriptionRepository.delete({ endpoint });
  }

  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    return this.subscriptionRepository.find({ where: { userId } });
  }

  private serializePayload(payload: PushPayload): string {
    return JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/logo.png',
      badge: payload.badge || '/logo.png',
      tag: payload.tag,
      url: payload.url || payload.data?.url,
      data: {
        ...(payload.data || {}),
        url: payload.url || payload.data?.url,
      },
      actions: payload.actions,
      renotify: payload.renotify,
    });
  }

  private async sendToSubscription(sub: PushSubscription, payload: string): Promise<void> {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
    } catch (error: any) {
      const statusCode = error.statusCode;
      if (statusCode === 410 || statusCode === 404 || statusCode === 401) {
        this.logger.warn(
          `Removing invalid push subscription ${sub.id} (status ${statusCode}): ${error.message}`,
        );
        await this.subscriptionRepository.delete(sub.id);
      } else if (statusCode === 429) {
        this.logger.warn(
          `Rate limited while sending to ${sub.userId} (status ${statusCode}): ${error.message}`,
        );
      } else {
        this.logger.error(
          `Failed to send push to ${sub.userId} (status ${statusCode ?? 'unknown'}): ${error.message}${
            error.body ? ` | body: ${error.body.slice(0, 200)}` : ''
          }`,
        );
      }
    }
  }

  async sendPush(userId: string, payload: PushPayload): Promise<void> {
    if (!this.vapidConfigured) return;

    const subscriptions = await this.getUserSubscriptions(userId);
    if (subscriptions.length === 0) return;

    const pushPayload = this.serializePayload(payload);
    for (const sub of subscriptions) {
      await this.sendToSubscription(sub, pushPayload);
    }
  }

  async sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (!this.vapidConfigured || userIds.length === 0) return;

    const uniqueIds = Array.from(new Set(userIds));
    const subscriptions = await this.subscriptionRepository.find({
      where: { userId: In(uniqueIds) },
    });

    if (subscriptions.length === 0) return;

    const pushPayload = this.serializePayload(payload);
    await Promise.allSettled(
      subscriptions.map((sub) => this.sendToSubscription(sub, pushPayload)),
    );
  }

  async sendToUserTypes(userTypes: string[], payload: PushPayload): Promise<void> {
    if (!this.vapidConfigured || userTypes.length === 0) return;

    const subscriptions = await this.subscriptionRepository.find({
      where: { userType: In(userTypes) },
    });

    if (subscriptions.length === 0) return;

    const pushPayload = this.serializePayload(payload);
    await Promise.allSettled(
      subscriptions.map((sub) => this.sendToSubscription(sub, pushPayload)),
    );
  }
}

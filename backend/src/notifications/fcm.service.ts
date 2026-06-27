import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { FcmToken } from './entities/fcm-token.entity';

export interface FcmPayload {
  title: string;
  body: string;
  image?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string>;
  tag?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  clickAction?: string;
  sound?: string;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepository: Repository<FcmToken>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const serviceAccountBase64 = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64');
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');

    if (!serviceAccountBase64 && !projectId) {
      this.logger.warn('Firebase not configured — FCM notifications disabled');
      return;
    }

    try {
      if (serviceAccountBase64) {
        const decoded = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(decoded);

        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }
      } else if (projectId) {
        if (admin.apps.length === 0) {
          admin.initializeApp({
            projectId,
          });
        }
        this.logger.warn(
          'Firebase initialized without service account — authentication via Application Default Credentials',
        );
      }

      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error: any) {
      this.logger.error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return this.initialized;
  }

  async registerToken(
    userId: string,
    fcmToken: string,
    deviceInfo?: string,
    platform?: string,
  ): Promise<FcmToken> {
    const existing = await this.fcmTokenRepository.findOne({
      where: { fcmToken },
    });

    if (existing) {
      if (existing.userId !== userId) {
        await this.fcmTokenRepository.update(existing.id, {
          userId,
          deviceInfo: deviceInfo || existing.deviceInfo,
          platform: platform || existing.platform,
          isActive: true,
        });
      } else {
        await this.fcmTokenRepository.update(existing.id, {
          deviceInfo: deviceInfo || existing.deviceInfo,
          platform: platform || existing.platform,
          isActive: true,
        });
      }
      return this.fcmTokenRepository.findOne({ where: { id: existing.id } });
    }

    const entity = this.fcmTokenRepository.create({
      userId,
      fcmToken,
      deviceInfo,
      platform,
      isActive: true,
    });

    return this.fcmTokenRepository.save(entity);
  }

  async unregisterToken(userId: string, fcmToken: string): Promise<void> {
    await this.fcmTokenRepository.delete({ userId, fcmToken });
  }

  async unregisterAllUserTokens(userId: string): Promise<void> {
    await this.fcmTokenRepository.delete({ userId });
  }

  async getUserTokens(userId: string): Promise<FcmToken[]> {
    return this.fcmTokenRepository.find({
      where: { userId, isActive: true },
    });
  }

  async markTokenInvalid(fcmToken: string): Promise<void> {
    await this.fcmTokenRepository.update({ fcmToken }, { isActive: false });
  }

  async sendToUser(userId: string, payload: FcmPayload): Promise<void> {
    if (!this.initialized) return;

    const tokens = await this.getUserTokens(userId);
    if (tokens.length === 0) return;

    await this.sendToTokens(
      tokens.map((t) => t.fcmToken),
      payload,
    );
  }

  async sendToUsers(userIds: string[], payload: FcmPayload): Promise<void> {
    if (!this.initialized || userIds.length === 0) return;

    const uniqueIds = Array.from(new Set(userIds));
    const tokens = await this.fcmTokenRepository.find({
      where: { userId: In(uniqueIds), isActive: true },
    });

    if (tokens.length === 0) return;

    const grouped = new Map<string, string[]>();
    for (const t of tokens) {
      const list = grouped.get(t.userId) || [];
      list.push(t.fcmToken);
      grouped.set(t.userId, list);
    }

    const allTokens = Array.from(grouped.values()).flat();
    await this.sendToTokens(allTokens, payload);
  }

  async sendToAllUsers(payload: FcmPayload): Promise<void> {
    if (!this.initialized) return;

    const tokens = await this.fcmTokenRepository.find({
      where: { isActive: true },
    });
    if (tokens.length === 0) return;

    await this.sendToTokens(
      tokens.map((t) => t.fcmToken),
      payload,
    );
  }

  private async sendToTokens(tokens: string[], payload: FcmPayload): Promise<void> {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image,
      },
      webpush: {
        notification: {
          icon: payload.icon || '/logo.png',
          badge: payload.badge || '/logo.png',
          tag: payload.tag,
          actions: payload.actions as any,
          requireInteraction: true,
          silent: false,
        },
        fcmOptions: {
          link: payload.clickAction || '/',
        },
        data: {
          ...(payload.data || {}),
          title: payload.title,
          body: payload.body,
          clickAction: payload.clickAction || '/',
          icon: payload.icon || '/logo.png',
        },
      },
      data: Object.fromEntries(
        Object.entries({
          title: payload.title,
          body: payload.body,
          ...(payload.data || {}),
          clickAction: payload.clickAction || '/',
          icon: payload.icon || '/logo.png',
        }).map(([k, v]) => [k, String(v)]),
      ),
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);

      const successCount = response.successCount;
      const failureCount = response.failureCount;

      if (failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            this.logger.warn(
              `FCM send failed for token ${idx}: ${resp.error.message}`,
            );

            if (
              resp.error.code === 'messaging/registration-token-not-registered' ||
              resp.error.code === 'messaging/invalid-registration-token'
            ) {
              this.markTokenInvalid(tokens[idx]);
            }
          }
        });
      }

      if (successCount > 0) {
        this.logger.debug(`FCM: ${successCount} delivered, ${failureCount} failed`);
      }
    } catch (error: any) {
      this.logger.error(`FCM send error: ${error.message}`);
    }
  }
}

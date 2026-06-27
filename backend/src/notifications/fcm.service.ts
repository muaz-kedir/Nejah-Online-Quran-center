import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { loadFirebaseServiceAccount } from './firebase-config.util';
import { FcmToken } from './entities/fcm-token.entity';

export type FcmMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  badge?: string;
  tag?: string;
  clickAction?: string;
};

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private ready = false;
  private initError: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepository: Repository<FcmToken>,
  ) {}

  onModuleInit(): void {
    this.initialize();
  }

  isReady(): boolean {
    return this.ready;
  }

  isConfigured(): boolean {
    return this.ready;
  }

  getInitError(): string | null {
    return this.initError;
  }

  private initialize(): void {
    if (this.ready) return;

    if (getApps().length > 0) {
      this.ready = true;
      this.logger.log('Firebase Admin SDK already initialized — reusing existing app');
      return;
    }

    const credentials = loadFirebaseServiceAccount({
      FIREBASE_PROJECT_ID:
        process.env.FIREBASE_PROJECT_ID ||
        this.configService.get<string>('FIREBASE_PROJECT_ID'),
      FIREBASE_CLIENT_EMAIL:
        process.env.FIREBASE_CLIENT_EMAIL ||
        this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
      FIREBASE_PRIVATE_KEY:
        process.env.FIREBASE_PRIVATE_KEY ||
        this.configService.get<string>('FIREBASE_PRIVATE_KEY'),
      FIREBASE_SERVICE_ACCOUNT_JSON:
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
        this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON'),
      FIREBASE_SERVICE_ACCOUNT_BASE64:
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
        this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_BASE64'),
      GOOGLE_APPLICATION_CREDENTIALS:
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS'),
    });

    if (!credentials) {
      this.initError = 'Firebase credentials not configured or invalid';
      this.logger.warn(
        'Firebase Admin SDK disabled — configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY on Render. ' +
          'Remove broken FIREBASE_SERVICE_ACCOUNT_JSON if present.',
      );
      return;
    }

    try {
      initializeApp({
        credential: cert(credentials.account),
        projectId: credentials.account.projectId,
      });
      this.ready = true;
      this.initError = null;
      this.logger.log(
        `Firebase Admin SDK initialized (source: ${credentials.source}, project: ${credentials.account.projectId})`,
      );
    } catch (error) {
      this.initError = (error as Error).message;
      this.logger.warn(
        `Firebase Admin SDK not initialized: ${this.initError}. Push notifications will use web-push (VAPID) only.`,
      );
    }
  }

  async registerToken(
    userId: string,
    fcmToken: string,
    deviceInfo?: string,
    platform?: string,
  ): Promise<FcmToken> {
    const existing = await this.fcmTokenRepository.findOne({ where: { fcmToken } });

    if (existing) {
      existing.userId = userId;
      existing.deviceInfo = deviceInfo ?? existing.deviceInfo;
      existing.platform = platform ?? existing.platform;
      existing.isActive = true;
      return this.fcmTokenRepository.save(existing);
    }

    const record = this.fcmTokenRepository.create({
      userId,
      fcmToken,
      deviceInfo,
      platform,
      isActive: true,
    });
    return this.fcmTokenRepository.save(record);
  }

  async unregisterToken(userId: string, fcmToken: string): Promise<void> {
    await this.fcmTokenRepository.update({ userId, fcmToken }, { isActive: false });
  }

  async unregisterAllUserTokens(userId: string): Promise<void> {
    await this.fcmTokenRepository.update({ userId }, { isActive: false });
  }

  async getUserTokens(userId: string): Promise<FcmToken[]> {
    return this.fcmTokenRepository.find({
      where: { userId, isActive: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async sendToUsers(userIds: string[], message: FcmMessage): Promise<number> {
    if (!this.ready || !userIds.length) return 0;

    const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
    const records = await this.fcmTokenRepository.find({
      where: { userId: In(uniqueUserIds), isActive: true },
    });

    if (!records.length) return 0;

    const tokens = [...new Set(records.map((r) => r.fcmToken).filter(Boolean))];
    return this.sendToTokens(tokens, message);
  }

  async sendToToken(token: string, message: FcmMessage): Promise<boolean> {
    if (!this.ready) {
      return false;
    }

    try {
      await getMessaging().send({
        token,
        notification: {
          title: message.title,
          body: message.body,
          imageUrl: message.icon,
        },
        data: this.stringifyData(message),
        webpush: message.clickAction
          ? {
              fcmOptions: { link: message.clickAction },
            }
          : undefined,
      });
      return true;
    } catch (error) {
      const errMsg = (error as Error).message || '';
      if (
        errMsg.includes('registration-token-not-registered') ||
        errMsg.includes('not a valid FCM registration token')
      ) {
        await this.fcmTokenRepository.update({ fcmToken: token }, { isActive: false });
      }
      this.logger.warn(`FCM send failed for token ${token.slice(0, 12)}…: ${errMsg}`);
      return false;
    }
  }

  async sendToTokens(tokens: string[], message: FcmMessage): Promise<number> {
    if (!this.ready || !tokens.length) return 0;

    const unique = [...new Set(tokens.filter(Boolean))];
    let sent = 0;

    for (const token of unique) {
      if (await this.sendToToken(token, message)) sent++;
    }

    return sent;
  }

  private stringifyData(message: FcmMessage): Record<string, string> {
    const data: Record<string, string> = { ...(message.data || {}) };
    if (message.tag) data.tag = message.tag;
    if (message.clickAction) data.url = message.clickAction;
    if (message.icon) data.icon = message.icon;
    if (message.badge) data.badge = message.badge;
    return Object.fromEntries(
      Object.entries(data).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
    );
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { loadFirebaseServiceAccount } from './firebase-config.util';

export type FcmMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private ready = false;
  private initError: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.initialize();
  }

  isReady(): boolean {
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

  async sendToToken(token: string, message: FcmMessage): Promise<boolean> {
    if (!this.ready) {
      this.logger.warn('FCM send skipped — Firebase not initialized');
      return false;
    }

    try {
      await getMessaging().send({
        token,
        notification: { title: message.title, body: message.body },
        data: message.data || {},
      });
      return true;
    } catch (error) {
      this.logger.warn(
        `FCM send failed for token ${token.slice(0, 12)}…: ${(error as Error).message}`,
      );
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
}

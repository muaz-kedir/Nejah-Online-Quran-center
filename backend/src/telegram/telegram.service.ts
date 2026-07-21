import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, LessThan, Raw } from 'typeorm';

import axios from 'axios';
import { randomBytes } from 'crypto';
import { TelegramSubscription } from './entities/telegram-subscription.entity';
import { TelegramLinkingCode } from './entities/telegram-linking-code.entity';
import { User } from '../users/entities/user.entity';

export interface TelegramMessage {
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  replyMarkup?: Record<string, unknown>;
}

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string;
  private apiBase: string;
  private botUsername: string;
  private configured = false;
  private lastUpdateId = 0;
  private pollingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TelegramSubscription)
    private readonly subscriptionRepository: Repository<TelegramSubscription>,
    @InjectRepository(TelegramLinkingCode)
    private readonly linkingCodeRepository: Repository<TelegramLinkingCode>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN')?.trim();
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not configured — Telegram bot disabled');
      return;
    }
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
    this.configured = true;

    try {
      const { data } = await axios.get(`${this.apiBase}/getMe`, { timeout: 10000 });
      if (data.ok) {
        this.botUsername = data.result.username;
        this.logger.log(`Telegram bot @${this.botUsername} initialized`);
      } else {
        this.logger.warn(`Telegram getMe returned not ok: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.description || err?.message || err?.code || 'unknown';
      this.logger.error(`Telegram bot token verification failed: ${detail}`);
      this.logger.warn('Telegram bot will be available for code generation but notifications may not work until the token is fixed.');
    }

    await this.deleteWebhook();
    this.cleanupExpiredCodes();
    if (this.configured) {
      this.startPollingLoop();
    }
  }

  onModuleDestroy() {
    this.stopPolling();
  }

  private async deleteWebhook() {
    try {
      const { data } = await axios.get(`${this.apiBase}/deleteWebhook`, { timeout: 10000 });
      if (data.ok) {
        this.logger.log('Existing webhook cleared');
      }
    } catch (err: any) {
      const detail = err?.response?.data?.description || err?.message || err?.code || 'unknown';
      this.logger.warn(`Failed to clear webhook: ${detail}`);
    }
  }

  private async pollUpdates() {
    if (!this.configured) return;

    try {
      const { data } = await axios.get(`${this.apiBase}/getUpdates`, {
        params: {
          offset: this.lastUpdateId + 1,
          timeout: 30,
          allowed_updates: ['message'],
        },
        timeout: 35000,
      });

      if (data.ok && data.result?.length) {
        for (const update of data.result) {
          if (update.update_id >= this.lastUpdateId) {
            this.lastUpdateId = update.update_id;
          }
          await this.handleUpdate(update);
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        this.logger.debug('Poll conflict (409) — another instance may be polling');
      } else if ((err as any)?.code !== 'ECONNABORTED') {
        this.logger.warn(`Poll updates error: ${(err as Error).message}`);
      }
    }
  }

  private async startPollingLoop() {
    this.pollingTimer = null;
    await this.pollUpdates();
    if (this.configured) {
      this.pollingTimer = setTimeout(() => this.startPollingLoop(), 1000);
    }
  }

  private async handleUpdate(update: any) {
    const message = update.message;
    if (!message?.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim();
    const username = message.from?.username || null;

    this.logger.log(`Received message from ${chatId}: "${text.substring(0, 50)}"`);

    // /start with optional code
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/);
      const rawCode = parts[1];
      if (!rawCode) {
        // Check if user is already linked
        const existing = await this.subscriptionRepository.findOne({
          where: { chatId, isActive: true },
        });
        if (existing) {
          await this.sendMessage(chatId, 'Your Telegram account is already linked to Nejah Online Quran Center! You will receive notifications for class sessions, attendance updates, and more.');
        } else {
          await this.sendMessage(chatId, 'Welcome to Nejah Online Quran Center!\n\nOpen the Nejah app → Profile Settings → "Link Telegram" to get a code, then send that code here.');
        }
        return;
      }
      await this.handleLinkCode(chatId, rawCode.toUpperCase(), username);
      return;
    }

    // Bare code (no /start prefix): treat as linking code attempt
    const codeCandidate = text.trim().toUpperCase();
    if (/^[A-Z0-9]{6,12}$/.test(codeCandidate)) {
      await this.handleLinkCode(chatId, codeCandidate, username);
      return;
    }

    // Unrecognized message
    await this.sendMessage(chatId, 'To link your account, open the Nejah app → Profile Settings → "Link Telegram" to get a code, then send that code here.');
  }

  private async handleLinkCode(chatId: number, code: string, username: string | null) {
    let linkingCode = await this.linkingCodeRepository.findOne({ where: { code } });

    if (!linkingCode) {
      // Fallback: case-insensitive lookup
      linkingCode = await this.linkingCodeRepository.findOne({
        where: { code: Raw((alias) => `UPPER(${alias}) = UPPER(:code)`, { code }) },
      });
    }

    if (!linkingCode) {
      this.logger.warn(`Linking code not found in DB for chatId ${chatId}: "${code}"`);
      await this.sendMessage(chatId, 'Invalid or expired code. Please generate a new code from your profile settings.');
      return;
    }

    if (linkingCode.consumed) {
      await this.sendMessage(chatId, 'This code has already been used. Your Telegram account should already be linked! If not, generate a new code from your profile settings.');
      return;
    }

    if (new Date() > linkingCode.expiresAt) {
      await this.sendMessage(chatId, 'This code has expired. Please generate a new code from your profile settings.');
      return;
    }

    // Mark code as consumed atomically
    const updateResult = await this.linkingCodeRepository
      .createQueryBuilder()
      .update(TelegramLinkingCode)
      .set({ consumed: true })
      .where('code = :code AND consumed = false', { code })
      .execute();

    if (updateResult.affected === 0) {
      await this.sendMessage(chatId, 'This code has already been used or is no longer valid. Please generate a new code from your profile settings.');
      return;
    }

    const existing = await this.subscriptionRepository.findOne({
      where: { userId: linkingCode.userId, isActive: true },
    });

    if (existing) {
      existing.chatId = chatId;
      existing.username = username;
      existing.isActive = true;
      await this.subscriptionRepository.save(existing);
    } else {
      const sub = this.subscriptionRepository.create({
        userId: linkingCode.userId,
        chatId,
        username,
        isActive: true,
      });
      await this.subscriptionRepository.save(sub);
    }

    await this.userRepository.update(linkingCode.userId, {
      telegramConnected: true,
      telegramChatId: `${chatId}`,
      telegramUsername: username,
    });

    const user = await this.userRepository.findOne({ where: { id: linkingCode.userId } });
    if (user && user.notificationEnabled && !user.onboardingCompleted) {
      user.onboardingCompleted = true;
      await this.userRepository.save(user);
      this.logger.log(`Onboarding auto-completed for user ${user.id} after Telegram link`);
    }

    const displayName = user?.name || user?.email || 'Student';
    await this.sendMessage(
      chatId,
      `✅ Telegram Connected!\n\nWelcome, ${displayName}! Your account has been linked to Nejah Online Quran Center.\n\nYou will now receive:\n• Live class notifications\n• Meeting links\n• Class reminders\n• Important announcements\n\nYou can close this chat — notifications will be delivered automatically.`,
    );
  }

  async generateLinkCode(userId: string): Promise<{ code: string; expiresAt: Date; botUsername: string }> {
    if (!this.configured) {
      throw new Error('Telegram bot is not configured. Set TELEGRAM_BOT_TOKEN in .env and restart the server.');
    }

    const code = randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const entity = this.linkingCodeRepository.create({ userId, code, expiresAt });
    await this.linkingCodeRepository.save(entity);

    return { code, expiresAt, botUsername: this.botUsername };
  }

  async getLinkStatus(userId: string): Promise<{ linked: boolean; username?: string }> {
    const sub = await this.subscriptionRepository.findOne({
      where: { userId, isActive: true },
    });
    return { linked: !!sub, username: sub?.username || undefined };
  }

  async unlink(userId: string): Promise<void> {
    await this.subscriptionRepository.update({ userId, isActive: true }, { isActive: false });
  }

  private async cleanupExpiredCodes() {
    await this.linkingCodeRepository.delete({ expiresAt: LessThan(new Date()) });
  }

  async sendMessage(chatId: number, text: string, options?: TelegramMessage): Promise<boolean> {
    if (!this.configured) return false;

    try {
      await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode || undefined,
        reply_markup: options?.replyMarkup || undefined,
        disable_web_page_preview: true,
      }, { timeout: 10000 });
      return true;
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.description || err?.message || err?.code || 'unknown';
      if (status === 403) {
        this.logger.warn(`Bot blocked by user ${chatId} — deactivating`);
        await this.subscriptionRepository.update({ chatId }, { isActive: false });
      } else {
        this.logger.error(`Failed to send Telegram message to ${chatId}: ${detail}`);
      }
      return false;
    }
  }

  async sendToUsers(
    userIds: string[],
    text: string,
    options?: TelegramMessage,
  ): Promise<number> {
    if (!this.configured || !userIds.length) return 0;

    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const subscriptions = await this.subscriptionRepository.find({
      where: { userId: In(uniqueIds), isActive: true },
    });

    if (!subscriptions.length) return 0;

    let sent = 0;
    for (const sub of subscriptions) {
      if (await this.sendMessage(sub.chatId, text, options)) {
        sent++;
      }
    }
    return sent;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  getBotUsername(): string | null {
    return this.botUsername || null;
  }

  async sendToUserTypes(
    userTypes: string[],
    text: string,
    options?: TelegramMessage,
  ): Promise<number> {
    return 0;
  }

  private stopPolling() {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}

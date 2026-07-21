import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { TelegramSubscription } from '../telegram/entities/telegram-subscription.entity';

export interface OnboardingStatus {
  notificationEnabled: boolean;
  telegramConnected: boolean;
  onboardingCompleted: boolean;
  requireNotifications: boolean;
  requireTelegram: boolean;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TelegramSubscription)
    private readonly telegramSubscriptionRepository: Repository<TelegramSubscription>,
  ) {}

  private requireNotifications(): boolean {
    return process.env.REQUIRE_NOTIFICATIONS !== 'false';
  }

  private requireTelegram(): boolean {
    return process.env.REQUIRE_TELEGRAM !== 'false';
  }

  async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      notificationEnabled: user.notificationEnabled,
      telegramConnected: user.telegramConnected,
      onboardingCompleted: user.onboardingCompleted,
      requireNotifications: this.requireNotifications(),
      requireTelegram: this.requireTelegram(),
    };
  }

  async enableNotifications(userId: string): Promise<OnboardingStatus> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.notificationEnabled = true;
    user.notificationEnabledAt = new Date();
    await this.userRepository.save(user);

    await this.tryCompleteOnboarding(user);

    return this.getOnboardingStatus(userId);
  }

  async syncTelegramStatus(userId: string): Promise<OnboardingStatus> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.telegramSubscriptionRepository.findOne({
      where: { userId, isActive: true },
    });

    user.telegramConnected = !!subscription;
    user.telegramChatId = subscription ? `${subscription.chatId}` : null;
    user.telegramUsername = subscription?.username || null;
    await this.userRepository.save(user);

    await this.tryCompleteOnboarding(user);

    return this.getOnboardingStatus(userId);
  }

  private async tryCompleteOnboarding(user: User): Promise<void> {
    const notifOk = this.requireNotifications() ? user.notificationEnabled : true;
    const tgOk = this.requireTelegram() ? user.telegramConnected : true;

    if (notifOk && tgOk && !user.onboardingCompleted) {
      user.onboardingCompleted = true;
      await this.userRepository.save(user);
      this.logger.log(`Onboarding completed for user ${user.id}`);
    }
  }
}

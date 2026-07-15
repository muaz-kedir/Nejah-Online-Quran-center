import { Controller, Get, Post, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  async getStatus(@CurrentUser() user: { id: string; role: string }) {
    return this.onboardingService.getOnboardingStatus(user.id);
  }

  @Post('notifications/enable')
  async enableNotifications(@CurrentUser() user: { id: string; role: string }) {
    return this.onboardingService.enableNotifications(user.id);
  }

  @Post('telegram/sync')
  async syncTelegram(@CurrentUser() user: { id: string; role: string }) {
    return this.onboardingService.syncTelegramStatus(user.id);
  }
}

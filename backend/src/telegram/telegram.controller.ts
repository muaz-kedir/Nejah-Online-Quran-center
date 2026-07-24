import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Request,
  UseGuards,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TelegramService } from './telegram.service';

@Controller('telegram')
@UseGuards(JwtAuthGuard)
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('generate-link')
  async generateLink(@Request() req) {
    if (!this.telegramService.isConfigured()) {
      throw new ServiceUnavailableException('Telegram bot is not configured');
    }
    const userId = req.user.id || req.user.sub;
    const result = await this.telegramService.generateLinkCode(userId);
    return result;
  }

  @Get('status')
  async getStatus(@Request() req) {
    const userId = req.user.id || req.user.sub;
    return this.telegramService.getLinkStatus(userId);
  }

  @Delete('unlink')
  async unlink(@Request() req) {
    const userId = req.user.id || req.user.sub;
    await this.telegramService.unlink(userId);
    return { success: true };
  }

  @Get('config')
  getConfig() {
    return {
      configured: this.telegramService.isConfigured(),
      botUsername: this.telegramService.getBotUsername(),
    };
  }
}

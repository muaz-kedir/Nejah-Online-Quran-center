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
import { FcmService } from './fcm.service';
import {
  RegisterFcmTokenDto,
  UnregisterFcmTokenDto,
} from './dto/register-fcm-token.dto';

@Controller('fcm')
@UseGuards(JwtAuthGuard)
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('tokens')
  async registerToken(
    @Request() req,
    @Body() dto: RegisterFcmTokenDto,
  ) {
    const userId = req.user.id || req.user.sub;
    const token = await this.fcmService.registerToken(
      userId,
      dto.fcmToken,
      dto.deviceInfo,
      dto.platform,
    );
    return { success: true, token };
  }

  @Delete('tokens')
  async unregisterToken(
    @Request() req,
    @Body() dto: UnregisterFcmTokenDto,
  ) {
    const userId = req.user.id || req.user.sub;
    await this.fcmService.unregisterToken(userId, dto.fcmToken);
    return { success: true };
  }

  @Delete('tokens/all')
  async unregisterAllTokens(@Request() req) {
    const userId = req.user.id || req.user.sub;
    await this.fcmService.unregisterAllUserTokens(userId);
    return { success: true };
  }

  @Get('tokens')
  async getTokens(@Request() req) {
    const userId = req.user.id || req.user.sub;
    const tokens = await this.fcmService.getUserTokens(userId);
    return { tokens };
  }

  @Get('status')
  getStatus() {
    return {
      configured: this.fcmService.isConfigured(),
    };
  }
}

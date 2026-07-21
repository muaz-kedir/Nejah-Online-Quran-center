import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TelegramSubscription } from './entities/telegram-subscription.entity';
import { TelegramLinkingCode } from './entities/telegram-linking-code.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelegramSubscription, TelegramLinkingCode, User]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService, TypeOrmModule],
})
export class TelegramModule {}

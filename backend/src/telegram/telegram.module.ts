import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TelegramSubscription } from './entities/telegram-subscription.entity';
import { TelegramLinkingCode } from './entities/telegram-linking-code.entity';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { LiveSession } from '../zoom/entities/live-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelegramSubscription, TelegramLinkingCode, User, Student, LiveSession]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService, TypeOrmModule],
})
export class TelegramModule {}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { PushSubscriptionService } from './push-subscription.service';
import { PushSubscriptionController } from './push-subscription.controller';
import { FcmToken } from './entities/fcm-token.entity';
import { FcmService } from './fcm.service';
import { FcmController } from './fcm.controller';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, PushSubscription, FcmToken, Student, Parent, User]),
    forwardRef(() => WebsocketModule),
  ],
  controllers: [NotificationsController, PushSubscriptionController, FcmController],
  providers: [NotificationsService, PushSubscriptionService, FcmService],
  exports: [NotificationsService, PushSubscriptionService, FcmService, TypeOrmModule],
})
export class NotificationsModule {}

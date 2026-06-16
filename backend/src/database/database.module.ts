import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { LearningGoalsModule } from '../learning-goals/learning-goals.module';
import { DatabaseBootstrapService } from './database-bootstrap.service';

@Module({
  imports: [UsersModule, LearningGoalsModule],
  providers: [DatabaseBootstrapService],
})
export class DatabaseModule {}

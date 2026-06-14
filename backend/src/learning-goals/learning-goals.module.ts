import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningGoal } from './entities/learning-goal.entity';
import { LearningGoalsController } from './learning-goals.controller';
import { LearningGoalsService } from './learning-goals.service';

@Module({
  imports: [TypeOrmModule.forFeature([LearningGoal])],
  controllers: [LearningGoalsController],
  providers: [LearningGoalsService],
  exports: [LearningGoalsService],
})
export class LearningGoalsModule {}

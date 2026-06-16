import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ensureDatabaseSchema } from './typeorm.config';
import { UsersService } from '../users/users.service';
import { LearningGoalsService } from '../learning-goals/learning-goals.service';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseBootstrapService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly learningGoalsService: LearningGoalsService,
  ) {}

  async onApplicationBootstrap() {
    await ensureDatabaseSchema(this.dataSource, this.logger);
    await this.usersService.ensureInitialUsers();
    await this.learningGoalsService.ensureSeedData();
    this.logger.log('Database bootstrap complete');
  }
}

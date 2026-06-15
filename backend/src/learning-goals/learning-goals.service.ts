import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningGoal } from './entities/learning-goal.entity';
import { CreateLearningGoalDto } from './dto/create-learning-goal.dto';

const DEFAULT_GOALS = [
  { name: 'Qaida Nooraniya', description: 'Foundational Arabic reading using the Qaida Nooraniya method' },
  { name: 'Quran Reading', description: 'Fluency in reading the Quran with proper pronunciation' },
  { name: 'Tajweed Program', description: 'Rules of Tajweed for correct Quranic recitation' },
  { name: 'Hifz Program', description: 'Memorization of the Holy Quran' },
  { name: "Hifz Muraja'a", description: 'Revision and consolidation of memorized portions' },
  { name: 'Custom', description: 'Other learning goals specified by the student or parent' },
];

@Injectable()
export class LearningGoalsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(LearningGoal)
    private readonly repo: Repository<LearningGoal>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const count = await this.repo.count();
      if (count === 0) {
        await this.repo.save(DEFAULT_GOALS.map(g => this.repo.create(g)));
      }
    } catch (error) {
      // Log but don't crash - tables might not exist yet (need to run migrations first)
      console.warn('Could not seed learning goals. Run migrations first:', error.message);
    }
  }

  findAll(): Promise<LearningGoal[]> {
    return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  findAllAdmin(): Promise<LearningGoal[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: string): Promise<LearningGoal> {
    return this.repo.findOneByOrFail({ id });
  }

  async create(dto: CreateLearningGoalDto): Promise<LearningGoal> {
    const goal = this.repo.create(dto);
    return this.repo.save(goal);
  }
}

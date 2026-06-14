import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeConfig } from './entities/fee-config.entity';
import { CreateFeeConfigDto } from './dto/create-fee-config.dto';
import { UpdateFeeConfigDto } from './dto/update-fee-config.dto';

@Injectable()
export class FeeConfigService {
  constructor(
    @InjectRepository(FeeConfig)
    private readonly repo: Repository<FeeConfig>,
  ) {}

  findAll(): Promise<FeeConfig[]> {
    return this.repo.find({ relations: ['learningGoal'], order: { country: 'ASC', learningGoal: { name: 'ASC' } } });
  }

  findOne(id: string): Promise<FeeConfig> {
    return this.repo.findOneByOrFail({ id });
  }

  async lookup(learningGoalId: string, country: string): Promise<FeeConfig | null> {
    return this.repo.findOne({
      where: { learningGoalId, country },
      relations: ['learningGoal'],
    });
  }

  async create(dto: CreateFeeConfigDto, userId?: string): Promise<FeeConfig> {
    const fee = this.repo.create({ ...dto, createdBy: userId });
    return this.repo.save(fee);
  }

  async update(id: string, dto: UpdateFeeConfigDto): Promise<FeeConfig> {
    const fee = await this.repo.findOneBy({ id });
    if (!fee) throw new NotFoundException('Fee config not found');
    Object.assign(fee, dto);
    return this.repo.save(fee);
  }

  async remove(id: string): Promise<void> {
    const fee = await this.repo.findOneBy({ id });
    if (!fee) throw new NotFoundException('Fee config not found');
    await this.repo.remove(fee);
  }
}

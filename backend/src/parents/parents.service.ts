import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './entities/parent.entity';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent)
    private parentsRepository: Repository<Parent>,
  ) {}

  async create(parentData: Partial<Parent>): Promise<Parent> {
    const parent = this.parentsRepository.create(parentData);
    return this.parentsRepository.save(parent);
  }

  async findByEmail(email: string): Promise<Parent | null> {
    return this.parentsRepository.findOne({ 
      where: { email },
      relations: ['user']
    });
  }

  async findOne(id: string): Promise<Parent | null> {
    return this.parentsRepository.findOne({ 
      where: { id },
      relations: ['user', 'students']
    });
  }
}

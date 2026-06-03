import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Resource, ResourceCategory, ResourceStatus } from './resources.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private resourcesRepository: Repository<Resource>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(studentId?: string, search?: string, category?: ResourceCategory): Promise<Resource[]> {
    const qb = this.resourcesRepository.createQueryBuilder('resource');

    if (studentId) {
      // For students, only show active resources
      qb.andWhere('resource.status = :status', { status: ResourceStatus.ACTIVE });
    }

    if (search) {
      qb.andWhere(
        'LOWER(resource.title) LIKE LOWER(:search) OR LOWER(resource.description) LIKE LOWER(:search) OR LOWER(resource.tags) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      qb.andWhere('resource.category = :category', { category });
    }

    return qb.orderBy('resource.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourcesRepository.findOne({ where: { id } });
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    return resource;
  }

  async incrementDownloadCount(id: string): Promise<Resource> {
    const resource = await this.findOne(id);
    resource.downloadCount += 1;
    resource.lastDownloadedAt = new Date();
    return this.resourcesRepository.save(resource);
  }

  async create(dto: Partial<Resource>): Promise<Resource> {
    const resource = this.resourcesRepository.create(dto);
    return this.resourcesRepository.save(resource);
  }

  async update(id: string, dto: Partial<Resource>): Promise<Resource> {
    const resource = await this.findOne(id);
    Object.assign(resource, dto);
    return this.resourcesRepository.save(resource);
  }

  async remove(id: string): Promise<void> {
    const resource = await this.findOne(id);
    await this.resourcesRepository.remove(resource);
  }

  async getCategories(): Promise<ResourceCategory[]> {
    return Object.values(ResourceCategory);
  }
}

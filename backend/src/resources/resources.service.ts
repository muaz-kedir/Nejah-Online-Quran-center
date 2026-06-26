import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource, ResourceStatus } from './resources.entity';
import { ResourceDownload } from './resource-download.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private resourcesRepository: Repository<Resource>,
    @InjectRepository(ResourceDownload)
    private downloadRepository: Repository<ResourceDownload>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  private async getStudentLevel(studentId: string): Promise<string> {
    const student = await this.studentRepository.findOne({ where: { userId: studentId } });
    return student?.level || 'All Levels';
  }

  async findAll(
    userId?: string,
    role?: string,
    search?: string,
    category?: string,
  ): Promise<Resource[]> {
    const qb = this.resourcesRepository.createQueryBuilder('resource');

    if (role === 'student' && userId) {
      qb.andWhere('resource.status = :status', { status: ResourceStatus.ACTIVE });
      const level = await this.getStudentLevel(userId);
      qb.andWhere('(resource.learningLevel = :level OR resource.learningLevel = :allLevels)', {
        level,
        allLevels: 'All Levels',
      });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(resource.titleEn) LIKE LOWER(:search) OR LOWER(resource.titleAr) LIKE LOWER(:search) OR LOWER(resource.titleAm) LIKE LOWER(:search) OR LOWER(resource.descriptionEn) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (category && category !== 'All') {
      qb.andWhere('resource.category = :category', { category });
    }

    return qb.orderBy('resource.displayOrder', 'ASC').addOrderBy('resource.createdAt', 'DESC').getMany();
  }

  async findFeatured(userId?: string, role?: string): Promise<Resource[]> {
    const qb = this.resourcesRepository.createQueryBuilder('resource')
      .where('resource.isFeatured = :featured', { featured: true });
    
    if (role === 'student' && userId) {
      qb.andWhere('resource.status = :status', { status: ResourceStatus.ACTIVE });
      const level = await this.getStudentLevel(userId);
      qb.andWhere('(resource.learningLevel = :level OR resource.learningLevel = :allLevels)', {
        level,
        allLevels: 'All Levels',
      });
    }

    return qb.orderBy('resource.displayOrder', 'ASC').addOrderBy('resource.createdAt', 'DESC').take(10).getMany();
  }

  async findRecent(userId?: string, role?: string): Promise<Resource[]> {
    const qb = this.resourcesRepository.createQueryBuilder('resource');
    
    if (role === 'student' && userId) {
      qb.andWhere('resource.status = :status', { status: ResourceStatus.ACTIVE });
      const level = await this.getStudentLevel(userId);
      qb.andWhere('(resource.learningLevel = :level OR resource.learningLevel = :allLevels)', {
        level,
        allLevels: 'All Levels',
      });
    }

    return qb.orderBy('resource.createdAt', 'DESC').take(5).getMany();
  }

  async findOne(id: string): Promise<Resource> {
    const resource = await this.resourcesRepository.findOne({ where: { id } });
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    return resource;
  }

  async recordDownload(userId: string, id: string): Promise<Resource> {
    const student = await this.studentRepository.findOne({ where: { userId } });
    const resource = await this.findOne(id);
    
    if (student) {
      const download = this.downloadRepository.create({
        studentId: student.id,
        resourceId: resource.id,
      });
      await this.downloadRepository.save(download);
    }

    resource.downloadCount += 1;
    resource.lastDownloadedAt = new Date();
    return this.resourcesRepository.save(resource);
  }

  async getDownloadHistory(userId: string): Promise<any[]> {
    const student = await this.studentRepository.findOne({ where: { userId } });
    if (!student) return [];
    
    const downloads = await this.downloadRepository.find({
      where: { studentId: student.id },
      relations: ['resource'],
      order: { downloadedAt: 'DESC' },
    });

    return downloads.map(d => ({
      id: d.id,
      downloadedAt: d.downloadedAt,
      resource: d.resource,
    }));
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

  async getCategories(userId?: string, role?: string): Promise<string[]> {
    const qb = this.resourcesRepository.createQueryBuilder('resource')
      .select('resource.category', 'category')
      .distinct(true)
      .where('resource.category IS NOT NULL');

    if (role === 'student' && userId) {
      qb.andWhere('resource.status = :status', { status: ResourceStatus.ACTIVE });
      const level = await this.getStudentLevel(userId);
      qb.andWhere('(resource.learningLevel = :level OR resource.learningLevel = :allLevels)', {
        level,
        allLevels: 'All Levels',
      });
    }

    const categories = await qb.getRawMany();
    return categories.map(c => c.category).filter(Boolean);
  }
}

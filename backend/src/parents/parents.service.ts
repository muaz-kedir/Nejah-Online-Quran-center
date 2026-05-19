import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { QueryParentDto } from './dto/query-parent.dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent)
    private parentsRepository: Repository<Parent>,
    private usersService: UsersService,
  ) {}

  async create(createParentDto: CreateParentDto): Promise<Parent> {
    // Check if parent email already exists
    const existing = await this.findByEmail(createParentDto.email);
    if (existing) {
      throw new ConflictException('A parent with this email already exists');
    }

    // Create user account for parent
    const user = await this.usersService.create({
      email: createParentDto.email,
      password: createParentDto.password || 'TemporaryPassword123!',
      name: createParentDto.fullName,
      role: UserRole.PARENT,
      phone: createParentDto.phoneNumber,
    });

    // Create parent profile
    const parent = this.parentsRepository.create({
      ...createParentDto,
      user,
    });

    return this.parentsRepository.save(parent);
  }

  async findByEmail(email: string): Promise<Parent | null> {
    return this.parentsRepository.findOne({ 
      where: { email },
      relations: ['user', 'students']
    });
  }

  async findAll(queryDto: QueryParentDto) {
    const { search, status, page = 1, limit = 5 } = queryDto;

    const qb = this.parentsRepository
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.user', 'user')
      .leftJoinAndSelect('parent.students', 'students');

    // Search by name or email
    if (search) {
      qb.andWhere(
        '(LOWER(parent.fullName) LIKE LOWER(:search) OR LOWER(parent.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Filter by status
    if (status) {
      qb.andWhere('parent.status = :status', { status });
    }

    // Pagination
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('parent.createdAt', 'DESC');

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentsRepository.findOne({ 
      where: { id },
      relations: ['user', 'students', 'students.user']
    });
    
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }
    
    return parent;
  }

  async update(id: string, updateParentDto: UpdateParentDto): Promise<Parent> {
    const parent = await this.findOne(id);

    // Check email uniqueness if being changed
    if (updateParentDto.email && updateParentDto.email !== parent.email) {
      const existing = await this.findByEmail(updateParentDto.email);
      if (existing) {
        throw new ConflictException('A parent with this email already exists');
      }
    }

    // Update user if email or name changed
    if (parent.user && (updateParentDto.email || updateParentDto.fullName)) {
      await this.usersService.update(parent.user.id, {
        email: updateParentDto.email,
        name: updateParentDto.fullName,
        phone: updateParentDto.phoneNumber,
      }, parent.user);
    }

    Object.assign(parent, updateParentDto);
    return this.parentsRepository.save(parent);
  }

  async remove(id: string): Promise<void> {
    const parent = await this.findOne(id);
    
    // Check if parent has students
    if (parent.students && parent.students.length > 0) {
      throw new BadRequestException('Cannot delete parent with linked students. Please reassign or remove students first.');
    }

    await this.parentsRepository.remove(parent);
  }

  async getParentStudents(id: string) {
    const parent = await this.findOne(id);
    return parent.students;
  }

  async assignStudentToParent(parentId: string, studentId: string) {
    const parent = await this.findOne(parentId);
    // The student assignment is handled in the students service
    return parent;
  }

  async getStats() {
    const total = await this.parentsRepository.count();
    const active = await this.parentsRepository.count({ where: { status: 'active' as any } });

    return {
      total,
      active,
      inactive: total - active,
    };
  }
}

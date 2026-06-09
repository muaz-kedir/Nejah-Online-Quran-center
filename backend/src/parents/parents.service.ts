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

  private resolveResidency(dto: { residency?: string; country?: string }): string {
    return dto.residency?.trim() || dto.country?.trim() || 'Not specified';
  }

  async findByPhone(phoneNumber: string): Promise<Parent | null> {
    return this.parentsRepository.findOne({
      where: { phoneNumber },
      relations: ['user', 'students'],
    });
  }

  async createProfileForExistingUser(user: { id: string }, dto: CreateParentDto): Promise<Parent> {
    const linked = await this.parentsRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['user', 'students'],
    });
    if (linked) {
      return linked;
    }

    const { password, ...parentData } = dto;
    const parent = this.parentsRepository.create({
      ...parentData,
      residency: this.resolveResidency(dto),
      user: { id: user.id } as any,
    });

    return this.parentsRepository.save(parent);
  }

  async findOrCreateForRegistration(
    dto: CreateParentDto,
  ): Promise<{ parent: Parent; message: string }> {
    const existingByEmail = await this.findByEmail(dto.email);
    if (existingByEmail) {
      return {
        parent: existingByEmail,
        message: 'Existing parent found. Student will be connected to the existing parent account.',
      };
    }

    if (dto.phoneNumber) {
      const existingByPhone = await this.findByPhone(dto.phoneNumber);
      if (existingByPhone) {
        return {
          parent: existingByPhone,
          message: 'Existing parent found. Student will be connected to the existing parent account.',
        };
      }
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      if (existingUser.role !== UserRole.PARENT) {
        throw new ConflictException('This email is already registered to another account type');
      }
      const parent = await this.createProfileForExistingUser(existingUser, dto);
      return {
        parent,
        message: 'Existing parent account linked. Student will be connected to the existing parent account.',
      };
    }

    const parent = await this.create(dto);
    return { parent, message: 'New parent account created.' };
  }

  async create(createParentDto: CreateParentDto): Promise<Parent> {
    const existing = await this.findByEmail(createParentDto.email);
    if (existing) {
      throw new ConflictException('A parent with this email already exists');
    }

    const existingUser = await this.usersService.findByEmail(createParentDto.email);
    if (existingUser) {
      if (existingUser.role === UserRole.PARENT) {
        return this.createProfileForExistingUser(existingUser, createParentDto);
      }
      throw new ConflictException('Email already exists');
    }

    const { password, ...parentData } = createParentDto;

    const user = await this.usersService.create({
      email: createParentDto.email,
      password: password || 'TemporaryPassword123!',
      name: createParentDto.fullName,
      role: UserRole.PARENT,
      phone: createParentDto.phoneNumber,
    });

    const parent = this.parentsRepository.create({
      ...parentData,
      residency: this.resolveResidency(createParentDto),
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

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    // Use findAndCount with relations - more reliable
    const [data, total] = await this.parentsRepository.findAndCount({
      where,
      relations: ['user', 'students'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

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

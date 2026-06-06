import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, ILike } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { DelegateStudentDto } from './dto/delegate-student.dto';
import { Schedule } from '../schedules/entities/schedule.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    private usersService: UsersService,
  ) {}

  private async generateStudentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.studentsRepository.count();
    const code = `NJ-${year}-${String(count + 1).padStart(3, '0')}`;
    return code;
  }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    // Check for duplicate email
    const existing = await this.studentsRepository.findOne({
      where: { email: createStudentDto.email },
    });
    if (existing) {
      throw new ConflictException('A student with this email already exists');
    }

    let userId: string | undefined;

    // If password is provided, create a companion User account
    if (createStudentDto.password) {
      const existingUser = await this.usersService.findByEmail(createStudentDto.email);
      if (existingUser) {
        throw new ConflictException('A user account with this email already exists');
      }

      const user = await this.usersService.create({
        email: createStudentDto.email,
        password: createStudentDto.password,
        name: createStudentDto.fullName,
        role: UserRole.STUDENT,
        phone: createStudentDto.familyPhone || '',
        avatar: createStudentDto.avatarUrl || '',
        isActive: true,
      });

      userId = user.id;
    }

    const { password, ...rest } = createStudentDto;
    const studentCode = await this.generateStudentCode();

    const student = this.studentsRepository.create({
      ...rest,
      studentCode,
      userId,
    });

    return this.studentsRepository.save(student);
  }

  async findAll(queryDto: QueryStudentDto & { isAssigned?: boolean }) {
    const { search, level, teacherId, status, page = 1, limit = 10, isAssigned } = queryDto;

    const qb = this.studentsRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.parent', 'parent')
      .leftJoinAndSelect('student.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'teacherUser')
      .leftJoinAndSelect('student.schedules', 'schedules');

    // Search by name or email
    if (search) {
      qb.andWhere(
        '(LOWER(student.fullName) LIKE LOWER(:search) OR LOWER(student.email) LIKE LOWER(:search) OR LOWER(student.studentCode) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Filter by level
    if (level) {
      qb.andWhere('student.level = :level', { level });
    }

    // Filter by teacher
    if (teacherId) {
      qb.andWhere('student.teacherId = :teacherId', { teacherId });
    }

    // Filter by status
    if (status) {
      qb.andWhere('student.status = :status', { status });
    }

    // Filter by assignment status
    if (isAssigned !== undefined) {
      qb.andWhere('student.isAssigned = :isAssigned', { isAssigned });
    }

    // Pagination
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('student.createdAt', 'DESC');

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

  async findAllUnassigned() {
    return this.studentsRepository.find({
      where: { isAssigned: false },
      relations: ['parent'],
      order: { fullName: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: ['parent', 'teacher', 'teacher.user'],
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async findByEmail(email: string): Promise<Student | null> {
    return this.studentsRepository.findOne({
      where: { email },
      relations: ['parent', 'teacher'],
    });
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);

    // Check email uniqueness if being changed
    if (updateStudentDto.email && updateStudentDto.email !== student.email) {
      const existing = await this.findByEmail(updateStudentDto.email);
      if (existing) {
        throw new ConflictException('A student with this email already exists');
      }
    }

    Object.assign(student, updateStudentDto);
    return this.studentsRepository.save(student);
  }

  async unassignFromTeacher(id: string): Promise<void> {
    // Explicit update to handle nulls more reliably than generic update DTOs
    await this.studentsRepository.update(id, { 
      teacherId: null, 
      isAssigned: false 
    });
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentsRepository.remove(student);
  }

  async getStats() {
    const total = await this.studentsRepository.count();
    const active = await this.studentsRepository.count({ where: { status: 'active' as any } });
    const avgAttendance = await this.studentsRepository
      .createQueryBuilder('student')
      .select('AVG(student.attendanceRate)', 'avg')
      .getRawOne();

    return {
      total,
      active,
      inactive: total - active,
      averageAttendance: parseFloat(avgAttendance?.avg || '0'),
    };
  }

  async delegateStudentToTeacher(delegateDto: DelegateStudentDto) {
    const { studentId, teacherId, startTime, endTime, className, meetingLink } = delegateDto;

    // Verify student exists
    const student = await this.findOne(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Assign teacher to student
    student.teacherId = teacherId;
    await this.studentsRepository.save(student);

    // Create schedule for the delegation
    const schedule = this.schedulesRepository.create({
      studentId,
      teacherId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      className: className || 'Quran Class',
      meetingLink,
    });

    const savedSchedule = await this.schedulesRepository.save(schedule);

    return {
      message: 'Student successfully delegated to teacher',
      student,
      schedule: savedSchedule,
    };
  }

  async resetPassword(studentId: string, newPassword: string): Promise<void> {
    const student = await this.findOne(studentId);

    if (!student.userId) {
      // If no companion user exists, create one
      const user = await this.usersService.create({
        email: student.email,
        password: newPassword,
        name: student.fullName,
        role: UserRole.STUDENT,
        isActive: true,
      });

      await this.studentsRepository.update(studentId, { userId: user.id });
      return;
    }

    // Update existing user's password
    await this.usersService.update(student.userId, { password: newPassword } as any, {
      role: UserRole.SUPER_ADMIN,
    } as any);
  }
}

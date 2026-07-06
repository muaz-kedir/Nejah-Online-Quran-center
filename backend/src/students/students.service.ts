import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, ILike, IsNull } from 'typeorm';
import { Student } from './entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { DelegateStudentDto } from './dto/delegate-student.dto';
import { Schedule } from '../schedules/entities/schedule.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/entities/notification.entity';
import { Teacher } from '../teachers/entities/teacher.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Parent)
    private parentsRepository: Repository<Parent>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  private async generateStudentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `NJ-${year}-`;
    const latest = await this.studentsRepository
      .createQueryBuilder('student')
      .where('student.studentCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('student.studentCode', 'DESC')
      .getOne();

    let nextNum = 1;
    if (latest?.studentCode) {
      const match = latest.studentCode.match(/NJ-\d{4}-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${String(nextNum).padStart(3, '0')}`;
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

    const { password, parentId, ...rest } = createStudentDto;
    const studentCode = await this.generateStudentCode();
    const resolvedUserId = userId ?? createStudentDto.userId;

    const student = this.studentsRepository.create({
      ...rest,
      studentCode,
      userId: resolvedUserId,
      parentId: parentId || null,
    });

    const savedStudent = await this.studentsRepository.save(student);

    // If a parent was specified, add this student to the parent's children list
    if (parentId) {
      const parent = await this.parentsRepository.findOne({ where: { id: parentId } });
      if (parent) {
        // If parent's students array is not loaded, fetch and update
        const parentWithStudents = await this.parentsRepository.findOne({
          where: { id: parentId },
          relations: ['students'],
        });
        if (
          parentWithStudents &&
          !parentWithStudents.students.some((s) => s.id === savedStudent.id)
        ) {
          parentWithStudents.students = [...(parentWithStudents.students || []), savedStudent];
          await this.parentsRepository.save(parentWithStudents);
        }
      }
    }

    return savedStudent;
  }

  async findAll(queryDto: QueryStudentDto & { isAssigned?: boolean }) {
    const {
      search,
      level,
      teacherId,
      status,
      country,
      city,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      isAssigned,
    } = queryDto;

    const qb = this.studentsRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.parent', 'parent')
      .leftJoinAndSelect('student.teacher', 'teacher')
      .leftJoinAndSelect('teacher.user', 'teacherUser')
      .leftJoinAndSelect('student.schedules', 'schedules');

    // Search by name, email, studentCode, parent name, or family properties
    if (search) {
      qb.andWhere(
        '(LOWER(student.fullName) LIKE LOWER(:search) ' +
          'OR LOWER(student.email) LIKE LOWER(:search) ' +
          'OR LOWER(student.studentCode) LIKE LOWER(:search) ' +
          'OR LOWER(student.phone) LIKE LOWER(:search) ' +
          'OR LOWER(student.familyName) LIKE LOWER(:search) ' +
          'OR LOWER(student.familyPhone) LIKE LOWER(:search) ' +
          'OR LOWER(parent.name) LIKE LOWER(:search) ' +
          'OR LOWER(parent.phone) LIKE LOWER(:search))',
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

    // Filter by location
    if (country) {
      qb.andWhere('student.country = :country', { country });
    }
    if (city) {
      qb.andWhere('student.city = :city', { city });
    }

    // Filter by date range
    if (startDate) {
      qb.andWhere('student.createdAt >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('student.createdAt <= :endDate', { endDate: new Date(endDate) });
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
      where: [{ isAssigned: false }, { teacherId: IsNull() }],
      relations: ['parent'],
      order: { fullName: 'ASC' },
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
    // Get student info before unassigning
    const student = await this.studentsRepository.findOne({ where: { id } });
    const previousTeacherId = student?.teacherId;

    await this.studentsRepository.update(id, {
      teacherId: null,
      isAssigned: false,
    });

    // Notify previous teacher
    if (previousTeacherId && student) {
      try {
        const teacher = await this.teachersRepository.findOne({ where: { id: previousTeacherId }, relations: ['user'] });
        const qiratManagers = await this.userRepository.find({
          where: { role: UserRole.QIRAT_MANAGER, isActive: true },
        });
        const recipientIds = [teacher?.userId, ...qiratManagers.map((u) => u.id)].filter(Boolean) as string[];
        if (recipientIds.length > 0) {
          await this.notificationsService.sendCustomNotifications(
            recipientIds,
            'Student Removed',
            `${student.fullName || 'A student'} has been removed from your roster`,
            { studentId: id, studentName: student.fullName },
            NotificationChannel.STUDENT_LEFT,
            true,
            '/teacher_students',
          );
        }
      } catch (error) {
        console.error('Failed to notify teacher about student removal:', error.message);
      }
    }
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.studentsRepository.remove(student);
  }

  async getStats() {
    const total = await this.studentsRepository.count();
    const active = await this.studentsRepository.count({ where: { status: 'active' as any } });

    // New Students this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newStudentsThisMonth = await this.studentsRepository
      .createQueryBuilder('student')
      .where('student.createdAt >= :firstDay', { firstDay: firstDayOfMonth })
      .getCount();

    const avgAttendance = await this.studentsRepository
      .createQueryBuilder('student')
      .select('AVG(student.attendanceRate)', 'avg')
      .getRawOne();

    return {
      total,
      active,
      inactive: total - active,
      newStudentsThisMonth,
      averageAttendance: parseFloat(avgAttendance?.avg || '0'),
    };
  }

  async changeStatus(
    id: string,
    status: any,
    reason: string,
    notes: string,
    adminId: string,
  ): Promise<Student> {
    const student = await this.findOne(id);

    student.status = status;
    student.statusChangeReason = reason;
    student.statusNotes = notes;
    student.statusChangedAt = new Date();

    // Attempt to get admin details
    const admin = await this.usersService.findOne(adminId).catch(() => null);
    student.statusChangedBy = admin ? admin.name : 'System Admin';

    return this.studentsRepository.save(student);
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
    await this.usersService.update(
      student.userId,
      { password: newPassword } as any,
      {
        role: UserRole.SUPER_ADMIN,
      } as any,
    );
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { In, IsNull, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { Student } from '../students/entities/student.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { UsersService } from '../users/users.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/entities/notification.entity';
import { Homework } from '../homework/entities/homework.entity';
import { HomeworkStatus } from '../homework/entities/homework.entity';
import { ExamEvaluation } from '../exams/entities/exam-evaluation.entity';
import { ClassSession, SessionStatus } from '../attendance/entities/class-session.entity';
import { StudentAttendance } from '../attendance/entities/student-attendance.entity';
import { Resource } from '../resources/resources.entity';
import { TeacherReplacementsService } from '../teacher-replacements/teacher-replacements.service';
import { LiveSession } from '../zoom/entities/live-session.entity';
import { SessionAttendance } from '../zoom/entities/session-attendance.entity';
import { AttendanceStatus } from '../zoom/enums/live-session-status.enum';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(ProgressLog)
    private progressLogRepository: Repository<ProgressLog>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(ExamEvaluation)
    private examEvaluationRepository: Repository<ExamEvaluation>,
    @InjectRepository(ClassSession)
    private classSessionRepository: Repository<ClassSession>,
    @InjectRepository(StudentAttendance)
    private studentAttendanceRepository: Repository<StudentAttendance>,
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
    @InjectRepository(LiveSession)
    private liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(SessionAttendance)
    private sessionAttendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => TeacherReplacementsService))
    private replacementsService: TeacherReplacementsService,
  ) {}

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    // 1. Check for email conflicts in both Teachers and Users
    const existingTeacher = await this.teachersRepository.findOne({
      where: { email: createTeacherDto.email },
    });
    if (existingTeacher) {
      throw new ConflictException('A teacher with this email already exists');
    }

    const existingUser = await this.usersService.findByEmail(createTeacherDto.email);
    if (existingUser) {
      throw new ConflictException('A user account with this email already exists');
    }

    // 2. Create the companion User account
    const user = await this.usersService.create({
      email: createTeacherDto.email,
      password: createTeacherDto.password, // Use password from form
      name: createTeacherDto.fullName,
      role: UserRole.TEACHER,
      phone: createTeacherDto.phoneNumber || '',
      avatar: createTeacherDto.avatarUrl || '', // Sync avatar Url
      isActive: true,
    });

    // 3. Create the Teacher record linked to the companion User (password is for User only)
    const { password: _password, ...teacherFields } = createTeacherDto;
    const teacher = this.teachersRepository.create({
      ...teacherFields,
      userId: user.id,
    });

    return this.teachersRepository.save(teacher);
  }

  async findAll(queryDto: QueryTeacherDto) {
    const { search, status, page = 1, limit = 10 } = queryDto;

    const qb = this.teachersRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.students', 'students')
      .leftJoinAndSelect('teacher.schedules', 'schedules');

    if (search) {
      qb.andWhere(
        '(LOWER(teacher.fullName) LIKE LOWER(:search) OR LOWER(teacher.email) LIKE LOWER(:search) OR LOWER(teacher.specialization) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (status && status !== 'all') {
      qb.andWhere('teacher.status = :status', { status });
    }

    // Pagination
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('teacher.createdAt', 'DESC');

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

  async findOne(id: string): Promise<Teacher> {
    const teacher = await this.teachersRepository.findOne({
      where: { id },
      relations: ['user', 'students', 'schedules', 'schedules.student'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async findByUserId(userId: string): Promise<Teacher> {
    const teacher = await this.teachersRepository.findOne({
      where: { userId },
      relations: ['user', 'students', 'schedules', 'schedules.student'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found for this user account');
    }

    return teacher;
  }

  /** Resolve Teacher entity from authenticated User id (JWT `req.user.id`).
   *  First tries lookups by userId → email → finds any existing Teacher record
   *  before auto-creating. This prevents UUID mismatch between assignment
   *  (which uses the Teacher's id) and dashboard (which resolves via userId). */
  async resolveAuthenticatedTeacher(userId: string): Promise<Teacher> {
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const user = await this.usersService.findOne(userId).catch(() => null);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== UserRole.TEACHER) {
      throw new ForbiddenException('User is not a teacher');
    }

    // 1. Look up by userId (primary)
    let teacher = await this.teachersRepository.findOne({ where: { userId } });
    if (teacher) return teacher;

    // 2. Fallback: look up by email (handles case where userId wasn't linked)
    if (user.email) {
      teacher = await this.teachersRepository.findOne({ where: { email: user.email } });
      if (teacher) {
        teacher.userId = user.id;
        return this.teachersRepository.save(teacher);
      }
    }

    // 3. Auto-create only if absolutely no Teacher record exists
    teacher = this.teachersRepository.create({
      userId: user.id,
      fullName: user.name,
      email: user.email,
      phoneNumber: user.phone || '',
      specialization: 'Quran',
      qualification: 'Auto-created from user account',
    });
    return this.teachersRepository.save(teacher);
  }

  async assertStudentBelongsToTeacher(teacherId: string, studentId: string): Promise<Student> {
    return this.assertTeacherCanTeachStudent(teacherId, studentId);
  }

  async assertTeacherCanTeachStudent(teacherId: string, studentId: string): Promise<Student> {
    return this.replacementsService.assertTeacherCanTeachStudent(teacherId, studentId);
  }

  async assertTeacherCanManageStudent(teacherId: string, studentId: string): Promise<Student> {
    return this.replacementsService.assertTeacherCanManageStudent(teacherId, studentId);
  }

  async assertTeacherCanViewStudent(teacherId: string, studentId: string): Promise<Student> {
    return this.replacementsService.assertTeacherCanViewStudent(teacherId, studentId);
  }

  async getFullStudentProfile(teacherId: string, studentId: string) {
    const student = await this.replacementsService.assertTeacherCanViewStudent(teacherId, studentId);
    const fullStudent = await this.studentsRepository.findOne({
      where: { id: studentId },
      relations: ['parent'],
    });
    if (!fullStudent) throw new NotFoundException('Student not found');

    const temporaryAssignments =
      await this.replacementsService.getTemporaryStudentsForTeacher(teacherId);
    const tempMap = new Map(temporaryAssignments.map((r) => [r.studentId, r]));
    const isTemporaryAssignment = fullStudent.teacherId !== teacherId && tempMap.has(fullStudent.id);

    return {
      ...fullStudent,
      isTemporaryAssignment,
      temporaryReplacement: tempMap.get(fullStudent.id) || null,
    };
  }

  async assertScheduleBelongsToTeacher(teacherId: string, scheduleId: string): Promise<Schedule> {
    const schedule = await this.schedulesRepository.findOne({ where: { id: scheduleId } });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }
    if (schedule.teacherId === teacherId) {
      return schedule;
    }
    const canTeach = await this.replacementsService.canTeacherTeachStudent(
      teacherId,
      schedule.studentId,
    );
    if (!canTeach) {
      throw new ForbiddenException('You do not have access to this schedule');
    }
    return schedule;
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.findOne(id);

    // 1. Check for email conflicts if changing email
    if (updateTeacherDto.email && updateTeacherDto.email !== teacher.email) {
      const existingTeacher = await this.teachersRepository.findOne({
        where: { email: updateTeacherDto.email },
      });
      if (existingTeacher) {
        throw new ConflictException('A teacher with this email already exists');
      }

      const existingUser = await this.usersService.findByEmail(updateTeacherDto.email);
      if (existingUser && existingUser.id !== teacher.userId) {
        throw new ConflictException('A user account with this email already exists');
      }
    }

    // 2. Update the companion User account if relevant details changed
    if (teacher.userId) {
      const user = await this.usersService.findOne(teacher.userId);
      const userUpdate: any = {};
      if (updateTeacherDto.fullName) userUpdate.name = updateTeacherDto.fullName;
      if (updateTeacherDto.email) userUpdate.email = updateTeacherDto.email;
      if (updateTeacherDto.phoneNumber) userUpdate.phone = updateTeacherDto.phoneNumber;
      if (updateTeacherDto.avatarUrl) userUpdate.avatar = updateTeacherDto.avatarUrl; // Update avatar profile sync

      await this.usersService.updateProfile(user.id, userUpdate);
    }

    // 3. Update the Teacher record
    Object.assign(teacher, updateTeacherDto);
    return this.teachersRepository.save(teacher);
  }

  async remove(id: string): Promise<void> {
    const teacher = await this.findOne(id);

    // Remove the teacher entity first
    await this.teachersRepository.remove(teacher);

    // If companion user exists, delete it too
    if (teacher.userId) {
      try {
        const user = await this.usersService.findOne(teacher.userId);
        // Direct deletion bypass
        const bypassAdmin = { role: UserRole.SUPER_ADMIN } as User;
        await this.usersService.remove(user.id, bypassAdmin);
      } catch (err) {
        console.error('Failed to delete companion user account:', err.message);
      }
    }
  }

  async assignStudents(teacherId: string, studentIds: string[]): Promise<Teacher> {
    const teacher = await this.findOne(teacherId);

    if (studentIds && studentIds.length > 0) {
      await this.studentsRepository
        .createQueryBuilder()
        .update(Student)
        .set({ teacherId: teacher.id, isAssigned: true })
        .whereInIds(studentIds)
        .execute();

      // Notify teacher about newly assigned students
      const students = await this.studentsRepository.find({ where: { id: In(studentIds) } });
      const studentNames = students.map((s) => s.fullName).filter(Boolean);
      if (teacher.userId && studentNames.length > 0) {
        const title = studentNames.length === 1 ? 'New Student Assigned' : 'New Students Assigned';
        const message = studentNames.length === 1
          ? `${studentNames[0]} has been assigned to you`
          : `${studentNames.length} students have been assigned to you: ${studentNames.join(', ')}`;

        const qiratManagers = await this.userRepository.find({
          where: { role: UserRole.QIRAT_MANAGER, isActive: true },
        });
        const recipients = [teacher.userId, ...qiratManagers.map((u) => u.id)];
        await this.notificationsService.sendCustomNotifications(
          recipients,
          title,
          message,
          { studentIds, teacherId: teacher.id },
          NotificationChannel.STUDENT_JOINED,
          true,
          '/teacher_students',
        );
      }
    }

    return this.findOne(teacherId);
  }

  async getTeacherDashboardStats(teacherId: string) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];

    const totalStudents = await this.studentsRepository.count({ where: { teacherId } });
    const todayClassesCount = await this.schedulesRepository.count({
      where: { teacherId, status: 'active', dayOfWeek: todayName },
    });

    const students = await this.studentsRepository.find({ where: { teacherId } });
    const totalAttendance = students.reduce((acc, s) => acc + Number(s.attendanceRate || 0), 0);
    const avgAttendance = students.length > 0 ? totalAttendance / students.length : 0;

    const studentIds = students.map((s) => s.id);
    const homeworkPending = studentIds.length > 0
      ? await this.homeworkRepository.count({
          where: { studentId: In(studentIds), status: HomeworkStatus.PENDING },
        })
      : 0;

    return {
      totalStudents,
      todayClassesCount,
      attendanceRate: Number(avgAttendance.toFixed(1)),
      homeworkPending,
    };
  }

  async getOverallStats() {
    const total = await this.teachersRepository.count();
    const active = await this.teachersRepository.count({ where: { status: 'active' } });
    const onLeave = await this.teachersRepository.count({ where: { status: 'on leave' } });
    const pending = await this.teachersRepository.count({ where: { status: 'pending' } });

    return { total, active, onLeave, pending };
  }

  async getTeacherAnalytics(id: string) {
    const teacher = await this.findOne(id);
    const studentIds = teacher.students?.map((s) => s.id) || [];

    // Per-student progress
    const progressRecords =
      studentIds.length > 0
        ? await this.progressRepository
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.student', 'student')
            .where('p.studentId IN (:...studentIds)', { studentIds })
            .orderBy('p.updatedAt', 'DESC')
            .getMany()
        : [];

    // Compute live teaching hours from schedules
    const schedules = teacher.schedules || [];
    let totalWeeklyHours = 0;
    for (const schedule of schedules) {
      if (schedule.startTimeString && schedule.endTimeString) {
        const [sh, sm] = schedule.startTimeString.split(':').map(Number);
        const [eh, em] = schedule.endTimeString.split(':').map(Number);
        const diffMinutes = eh * 60 + em - (sh * 60 + sm);
        if (diffMinutes > 0) totalWeeklyHours += diffMinutes / 60;
      }
    }

    // Topics derived from teachingTopics field or from student progress
    const topics = teacher.teachingTopics
      ? teacher.teachingTopics
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    return {
      studentCount: studentIds.length,
      studentDetails: progressRecords.map((p) => ({
        studentId: p.studentId,
        studentName: (p.student as any)?.fullName || 'Unknown',
        progressPercentage: p.progressPercentage,
        rank: p.rank,
        lastStudiedSurah: p.lastStudiedSurah,
        surahsCount: p.surahsCount,
      })),
      totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100,
      topics,
      monthlySalary: teacher.monthlySalary,
      islamicEducationLevel: teacher.islamicEducationLevel,
    };
  }

  // ─── Teacher Dashboard Data ──────────────────────────────────────────────────
  async getTeacherDashboardData(teacherId: string) {
    const teacher = await this.teachersRepository.findOne({
      where: { id: teacherId },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Students
    const students = await this.studentsRepository.find({
      where: { teacherId },
    });

    const studentIds = students.map((s) => s.id);

    // Schedules
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];

    const todaySchedules = await this.schedulesRepository.find({
      where: { teacherId, status: 'active', dayOfWeek: todayName },
      relations: ['student'],
    });

    const upcomingDayNames = days.filter((d) => d !== todayName);
    const upcomingSchedules = await this.schedulesRepository.find({
      where: { teacherId, status: 'active', dayOfWeek: In(upcomingDayNames) },
    });

    // Active students
    const activeStudents = students.filter((s) => s.status !== 'inactive').length;

    // Completed classes today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const completedClassesToday = studentIds.length > 0
      ? await this.classSessionRepository.count({
          where: {
            teacherId,
            status: SessionStatus.COMPLETED,
            sessionDate: todayStart,
          },
        })
      : 0;

    // Pending homework
    const pendingHomeworkReviews = studentIds.length > 0
      ? await this.homeworkRepository.count({
          where: { studentId: In(studentIds), status: HomeworkStatus.PENDING },
        })
      : 0;

    // Pending evaluations (no score recorded)
    const pendingEvaluations = studentIds.length > 0
      ? await this.examEvaluationRepository.count({
          where: { teacherId, score: IsNull() },
        })
      : 0;

    // Attendance rate from live session records (last 30 days), fallback to student profile field
    const totalAttendanceRate = await this.computeTeacherLiveAttendanceRate(teacherId, studentIds);

    // Average progress
    const totalProgressRate =
      students.length > 0
        ? students.reduce((sum, s) => sum + (Number(s.progressRate) || 0), 0) / students.length
        : 0;

    // Progress records for student progress data
    const progressRecords = studentIds.length > 0
      ? await this.progressRepository.find({
          where: { studentId: In(studentIds) },
          order: { updatedAt: 'ASC' },
        })
      : [];

    const progressMap = new Map(progressRecords.map((p) => [p.studentId, p]));

    const studentProgress = students.map((s) => {
      const prog = progressMap.get(s.id);
      const rate = prog?.progressPercentage ?? Number(s.progressRate) ?? 0;
      return {
        id: s.id,
        name: s.fullName,
        initials: s.fullName
          .split(' ')
          .map((n) => n[0])
          .join(''),
        currentSurah: prog?.lastStudiedSurah || null,
        status: rate >= 80 ? 'EXCEEDING' : rate >= 50 ? 'ON TRACK' : 'NEEDS REVIEW',
        progress: Number(rate),
      };
    });

    return {
      teacher: {
        id: teacher.id,
        fullName: teacher.fullName,
        email: teacher.email,
        phoneNumber: teacher.phoneNumber,
        gender: teacher.gender,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        experience: teacher.experience,
        availability: teacher.teachingTimeAvailability || [],
        avatarUrl: teacher.avatarUrl,
        country: teacher.country,
        city: teacher.city,
        streetAddress: teacher.streetAddress,
        dateOfBirth: teacher.dateOfBirth,
        languages: teacher.languages,
        qiratEducationLevel: teacher.qiratEducationLevel,
        islamicEducationLevel: teacher.islamicEducationLevel,
        teachingTopics: teacher.teachingTopics,
        status: teacher.status,
        monthlySalary: teacher.monthlySalary,
        notes: teacher.notes,
        userId: teacher.userId,
        teacherCode: teacher.id?.slice(0, 8).toUpperCase(),
      },
      stats: {
        totalStudents: students.length,
        activeStudents,
        todayClasses: todaySchedules.length,
        upcomingClasses: upcomingSchedules.length,
        completedClassesToday,
        pendingHomeworkReviews,
        pendingEvaluations,
        attendanceRate: Number(totalAttendanceRate.toFixed(1)),
        averageProgressRate: Number(totalProgressRate.toFixed(1)),
      },
      recentActivities: await this.getRecentActivities(teacherId, studentIds, 20),
      upcomingTasks: await this.getUpcomingTasks(teacherId, studentIds),
      temporaryStudents: await this.replacementsService.getTemporaryStudentsForTeacher(teacherId),
      reassignedAwayStudents: await this.replacementsService.getReassignedAwayForTeacher(teacherId),
      studentProgress,
    };
  }

  private async computeTeacherLiveAttendanceRate(
    teacherId: string,
    studentIds: string[],
  ): Promise<number> {
    if (!studentIds.length) return 0;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const attendances = await this.sessionAttendanceRepository
      .createQueryBuilder('sa')
      .innerJoin('sa.session', 'session')
      .where('session.teacherId = :teacherId', { teacherId })
      .andWhere('sa.studentId IN (:...studentIds)', { studentIds })
      .andWhere('session.scheduledStart >= :since', { since: thirtyDaysAgo })
      .getMany();

    if (!attendances.length) {
      const students = await this.studentsRepository.find({ where: { id: In(studentIds) } });
      return students.length > 0
        ? students.reduce((sum, s) => sum + (Number(s.attendanceRate) || 0), 0) / students.length
        : 0;
    }

    const presentCount = attendances.filter(
      (a) =>
        a.attendanceStatus === AttendanceStatus.PRESENT ||
        a.attendanceStatus === AttendanceStatus.LATE ||
        a.attendanceStatus === AttendanceStatus.PARTIAL,
    ).length;

    return Math.round((presentCount / attendances.length) * 1000) / 10;
  }

  // ─── Recent Activities ───────────────────────────────────────────────────────
  async getRecentActivities(teacherId: string, studentIds: string[], limit = 20) {
    const activities: any[] = [];

    // Progress logs (lesson completed)
    if (studentIds.length > 0) {
      const logs = await this.progressLogRepository.find({
        where: { teacherId },
        relations: ['student'],
        order: { createdAt: 'DESC' },
        take: limit,
      });
      for (const log of logs) {
        activities.push({
          id: `log-${log.id}`,
          type: 'LESSON_COMPLETED',
          studentName: log.student?.fullName || 'Unknown',
          studentId: log.studentId,
          date: log.createdAt,
          description: log.notes || log.topicName || 'Lesson completed',
        });
      }

      // Homework submissions/reviews
      const homeworks = await this.homeworkRepository.find({
        where: { studentId: In(studentIds), assignedByTeacherId: teacherId },
        relations: ['student'],
        order: { updatedAt: 'DESC' },
        take: limit,
      });
      for (const hw of homeworks) {
        const type = hw.status === HomeworkStatus.COMPLETED ? 'HOMEWORK_SUBMITTED' : 'HOMEWORK_REVIEWED';
        activities.push({
          id: `hw-${hw.id}`,
          type,
          studentName: hw.student?.fullName || 'Unknown',
          studentId: hw.studentId,
          date: hw.updatedAt,
          description: hw.title,
        });
      }

      // Evaluations
      const evaluations = await this.examEvaluationRepository.find({
        where: { teacherId },
        relations: ['student'],
        order: { createdAt: 'DESC' },
        take: limit,
      });
      for (const ev of evaluations) {
        activities.push({
          id: `eval-${ev.id}`,
          type: 'EVALUATION_SUBMITTED',
          studentName: ev.student?.fullName || 'Unknown',
          studentId: ev.studentId,
          date: ev.createdAt,
          description: `${ev.programType} - ${ev.evaluationType}`,
        });
      }

      // Live session attendance (Zoom module)
      const liveSessions = await this.liveSessionRepository.find({
        where: { teacherId },
        relations: ['schedule'],
        order: { scheduledStart: 'DESC' },
        take: 10,
      });
      for (const liveSession of liveSessions) {
        const liveAttendances = await this.sessionAttendanceRepository.find({
          where: { sessionId: liveSession.id },
          relations: ['student'],
        });
        for (const att of liveAttendances.slice(0, 5)) {
          const type =
            att.attendanceStatus === AttendanceStatus.PRESENT ||
            att.attendanceStatus === AttendanceStatus.LATE ||
            att.attendanceStatus === AttendanceStatus.PARTIAL
              ? 'STUDENT_JOINED'
              : 'STUDENT_MISSED';
          activities.push({
            id: `live-att-${att.id}`,
            type,
            studentName: att.student?.fullName || 'Unknown',
            studentId: att.studentId,
            date: att.leaveTime || att.joinTime || liveSession.scheduledStart,
            description: `${att.attendanceStatus} - ${liveSession.schedule?.className || 'Live Session'}`,
          });
        }
      }

      // Legacy class session attendance
      const sessions = await this.classSessionRepository.find({
        where: { teacherId },
        relations: ['studentAttendances', 'studentAttendances.student'],
        order: { sessionDate: 'DESC' },
        take: 20,
      });
      for (const session of sessions) {
        for (const att of (session.studentAttendances || []).slice(0, 5)) {
          const type = att.attendanceStatus === 'PRESENT' || att.attendanceStatus === 'LATE'
            ? 'STUDENT_JOINED'
            : 'STUDENT_MISSED';
          activities.push({
            id: `att-${att.id}`,
            type,
            studentName: att.student?.fullName || 'Unknown',
            studentId: att.studentId,
            date: att.createdAt || session.sessionDate,
            description: `${att.attendanceStatus} - ${session.classTitle || 'Class'}`,
          });
        }
      }
    }

    // Sort by newest first, limit
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return activities.slice(0, limit);
  }

  // ─── Upcoming Tasks ──────────────────────────────────────────────────────────
  async getUpcomingTasks(teacherId: string, studentIds: string[]) {
    const tasks: any[] = [];
    if (studentIds.length === 0) return tasks;

    // Get student names for lookups
    const students = await this.studentsRepository.find({
      where: { id: In(studentIds) },
      select: ['id', 'fullName'],
    });
    const studentNameMap = new Map(students.map((s) => [s.id, s.fullName]));

    // Pending homework reviews
    const pendingHomeworks = await this.homeworkRepository.find({
      where: { studentId: In(studentIds), status: HomeworkStatus.PENDING },
      relations: ['student'],
      order: { dueDate: 'ASC' },
      take: 20,
    });
    for (const hw of pendingHomeworks) {
      const dueDays = hw.dueDate
        ? Math.ceil((new Date(hw.dueDate).getTime() - Date.now()) / 86400000)
        : null;
      tasks.push({
        type: 'HOMEWORK_REVIEW',
        title: hw.title,
        studentName: hw.student?.fullName || studentNameMap.get(hw.studentId) || 'Unknown',
        studentId: hw.studentId,
        homeworkId: hw.id,
        dueDate: hw.dueDate,
        urgency: dueDays !== null && dueDays <= 0 ? 'overdue' : dueDays !== null && dueDays <= 2 ? 'soon' : 'normal',
        daysRemaining: dueDays,
      });
    }

    // Pending evaluations
    const pendingEvals = await this.examEvaluationRepository.find({
      where: { teacherId, score: IsNull() },
      relations: ['student'],
      order: { createdAt: 'ASC' },
      take: 20,
    });
    for (const ev of pendingEvals) {
      tasks.push({
        type: 'EVALUATION_PENDING',
        title: `${ev.programType} Evaluation`,
        studentName: ev.student?.fullName || studentNameMap.get(ev.studentId) || 'Unknown',
        studentId: ev.studentId,
        evaluationId: ev.id,
        createdAt: ev.createdAt,
        urgency: 'normal',
      });
    }

    // Classes starting within 1 hour
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[now.getDay()];
    const soonSchedules = await this.schedulesRepository.find({
      where: { teacherId, status: 'active', dayOfWeek: todayName },
      relations: ['student'],
    });
    for (const sched of soonSchedules) {
      if (!sched.startTimeString) continue;
      const [h, m] = sched.startTimeString.split(':').map(Number);
      const schedMinutes = h * 60 + m;
      const diff = schedMinutes - currentMinutes;
      if (diff >= 0 && diff <= 60) {
        tasks.push({
          type: 'CLASS_STARTING_SOON',
          title: sched.className || 'Quran Class',
          studentName: sched.student?.fullName || studentNameMap.get(sched.studentId) || 'Student',
          studentId: sched.studentId,
          scheduleId: sched.id,
          startTime: sched.startTimeString,
          minutesUntilStart: diff,
          urgency: diff <= 15 ? 'critical' : 'soon',
        });
      }
    }

    // Students without progress log in 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    for (const studentId of studentIds) {
      const latestLog = await this.progressLogRepository.findOne({
        where: { studentId, teacherId },
        order: { createdAt: 'DESC' },
      });
      if (!latestLog || latestLog.createdAt < sevenDaysAgo) {
        const studentName = studentNameMap.get(studentId) || 'Unknown';
        tasks.push({
          type: 'PROGRESS_NOT_UPDATED',
          title: 'Progress not updated',
          studentName,
          studentId,
          lastActivity: latestLog?.createdAt || null,
          daysSinceLastUpdate: latestLog
            ? Math.ceil((Date.now() - latestLog.createdAt.getTime()) / 86400000)
            : null,
          urgency: 'normal',
        });
      }
    }

    // Sort: overdue/critical first, then by date
    const urgencyRank: Record<string, number> = { overdue: 0, critical: 1, soon: 2, normal: 3 };
    tasks.sort((a, b) => (urgencyRank[a.urgency] || 3) - (urgencyRank[b.urgency] || 3));

    return tasks;
  }

  // ─── Search Teacher Data ─────────────────────────────────────────────────────
  async searchTeacherData(teacherId: string, query: string) {
    if (!query || query.trim().length < 2) return [];

    const results: any[] = [];
    const searchTerm = `%${query.trim()}%`;

    // Students
    const students = await this.studentsRepository
      .createQueryBuilder('s')
      .where('s.teacherId = :teacherId', { teacherId })
      .andWhere(
        '(LOWER(s.fullName) LIKE LOWER(:q) OR LOWER(s.email) LIKE LOWER(:q) OR LOWER(s.studentCode) LIKE LOWER(:q))',
        { q: searchTerm },
      )
      .limit(10)
      .getMany();
    for (const s of students) {
      results.push({
        type: 'student',
        id: s.id,
        label: s.fullName,
        subtitle: `${s.studentCode || 'No code'} · ${s.level || 'Beginner'}`,
        route: `/teacher_students/${s.id}`,
      });
    }

    // Homework
    const homeworks = await this.homeworkRepository
      .createQueryBuilder('hw')
      .leftJoinAndSelect('hw.student', 'student')
      .where('hw.assignedByTeacherId = :teacherId', { teacherId })
      .andWhere('LOWER(hw.title) LIKE LOWER(:q)', { q: searchTerm })
      .limit(10)
      .getMany();
    for (const hw of homeworks) {
      results.push({
        type: 'homework',
        id: hw.id,
        label: hw.title,
        subtitle: `${hw.student?.fullName || 'Unknown'} · ${hw.status}`,
        route: `/teacher_students/${hw.studentId}`,
      });
    }

    // Progress log notes
    const logs = await this.progressLogRepository
      .createQueryBuilder('pl')
      .leftJoinAndSelect('pl.student', 'student')
      .where('pl.teacherId = :teacherId', { teacherId })
      .andWhere('LOWER(pl.notes) LIKE LOWER(:q)', { q: searchTerm })
      .limit(10)
      .getMany();
    for (const log of logs) {
      results.push({
        type: 'note',
        id: log.id,
        label: `Daily Progress Note`,
        subtitle: `${log.student?.fullName || 'Unknown'} · ${log.createdAt ? new Date(log.createdAt).toLocaleDateString() : ''}`,
        route: `/teacher_students/${log.studentId}`,
      });
    }

    // Resources (shared, not teacher-scoped — but limited for relevance)
    const resources = await this.resourceRepository
      .createQueryBuilder('r')
      .where(
        '(LOWER(r.titleEn) LIKE LOWER(:q) OR LOWER(r.titleAr) LIKE LOWER(:q) OR LOWER(r.category) LIKE LOWER(:q))',
        { q: searchTerm },
      )
      .limit(10)
      .getMany();
    for (const r of resources) {
      results.push({
        type: 'resource',
        id: r.id,
        label: r.titleEn || r.titleAr || 'Resource',
        subtitle: r.category || 'Uncategorized',
        route: `/student/resources`,
      });
    }

    return results;
  }

  // Get teacher's students list (permanent + temporary assignments)
  async getTeacherStudents(teacherId: string, page = 1, limit = 10, search = '') {
    const temporaryAssignments =
      await this.replacementsService.getTemporaryStudentsForTeacher(teacherId);
    const tempStudentIds = temporaryAssignments.map((r) => r.studentId);

    const qb = this.studentsRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .where('(student.teacherId = :teacherId OR student.id IN (:...tempStudentIds))', {
        teacherId,
        tempStudentIds: tempStudentIds.length
          ? tempStudentIds
          : ['00000000-0000-0000-0000-000000000000'],
      });

    if (search) {
      qb.andWhere(
        '(LOWER(student.fullName) LIKE LOWER(:search) OR LOWER(student.email) LIKE LOWER(:search) OR LOWER(student.level) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('student.createdAt', 'DESC');

    const [students, total] = await qb.getManyAndCount();

    const tempMap = new Map(temporaryAssignments.map((r) => [r.studentId, r]));

    return {
      data: students.map((s) => ({
        ...s,
        isTemporaryAssignment: s.teacherId !== teacherId && tempMap.has(s.id),
        temporaryReplacement: tempMap.get(s.id) || null,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      temporaryAssignments,
      reassignedAway: await this.replacementsService.getReassignedAwayForTeacher(teacherId),
    };
  }

  // Get teacher's schedule
  async getTeacherSchedule(teacherId: string) {
    const schedules = await this.schedulesRepository.find({
      where: { teacherId, status: 'active' },
      relations: ['student'],
    });

    return schedules.map((s) => ({
      id: s.id,
      studentName: s.student?.fullName || 'Unknown',
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTimeString,
      endTime: s.endTimeString,
      status: s.status,
      meetingLink: s.meetingLink,
      notes: s.notes,
    }));
  }

  // Get teacher's notifications (scoped to the teacher's User account)
  async getTeacherNotifications(teacherId: string, page = 1, limit = 20) {
    const teacher = await this.findOne(teacherId);
    if (!teacher.userId) {
      return {
        notifications: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const all = await this.notificationsService.getNotifications(teacher.userId);
    const total = all.length;
    const start = (page - 1) * limit;
    const notifications = all.slice(start, start + limit);

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

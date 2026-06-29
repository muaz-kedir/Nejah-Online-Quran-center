import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Parent } from './entities/parent.entity';
import { Student } from '../students/entities/student.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Feedback } from '../progress/entities/feedback.entity';
import { Progress } from '../progress/entities/progress.entity';
import { ProgressLog } from '../progress/entities/progress-log.entity';

@Controller('parent/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PARENT)
export class ParentDashboardController {
  constructor(
    @InjectRepository(Parent)
    private parentsRepository: Repository<Parent>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(ProgressLog)
    private progressLogRepository: Repository<ProgressLog>,
  ) {}

  @Get()
  async getDashboardData(@Request() req) {
    const userId = req.user.id;

    // 1. Get Parent Profile
    const parent = await this.parentsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'students', 'students.teacher'],
    });

    if (!parent) {
      return {
        message: 'Parent profile not found',
        parent: { name: '', email: req.user.email },
        stats: {
          totalChildren: 0,
          activeClasses: 0,
          attendanceRate: '0',
          memorizationProgress: '0',
          pendingHomework: 0,
          upcomingExams: 0,
        },
        children: [],
        activities: [],
        schedules: [],
      };
    }

    const studentIds = parent.students?.map((s) => s.id) || [];

    // 2. Summary Stats
    const totalChildren = studentIds.length;
    let activeClasses = 0;
    let pendingHomework = 0;
    const upcomingExams = 0;

    if (totalChildren > 0) {
      activeClasses = await this.schedulesRepository.count({
        where: { studentId: In(studentIds) },
      });

      pendingHomework = await this.homeworkRepository.count({
        where: { studentId: In(studentIds), status: 'Pending' as any },
      });
    }

    // Calculate aggregate attendance and progress for children
    const avgAttendance =
      totalChildren > 0
        ? parent.students.reduce((acc, s) => acc + Number(s.attendanceRate || 0), 0) / totalChildren
        : 0;

    let progressByStudent: Record<string, Progress> = {};
    const logsByStudent: Record<string, ProgressLog[]> = {};
    if (totalChildren > 0) {
      const progressRecords = await this.progressRepository.find({
        where: { studentId: In(studentIds) },
        // ASC so the most recently updated record wins in the map below
        // (students may have one progress row per learning track).
        order: { updatedAt: 'ASC' },
      });
      progressByStudent = Object.fromEntries(progressRecords.map((p) => [p.studentId, p]));

      const recentLogs = await this.progressLogRepository.find({
        where: { studentId: In(studentIds) },
        relations: ['teacher', 'student'],
        order: { createdAt: 'DESC' },
        take: totalChildren * 5,
      });
      for (const log of recentLogs) {
        if (!logsByStudent[log.studentId]) {
          logsByStudent[log.studentId] = [];
        }
        if (logsByStudent[log.studentId].length < 5) {
          logsByStudent[log.studentId].push(log);
        }
      }
    }

    const avgProgress =
      totalChildren > 0 && Object.keys(progressByStudent).length > 0
        ? Object.values(progressByStudent).reduce(
            (acc, p) => acc + (p.progressPercentage || 0),
            0,
          ) / totalChildren
        : totalChildren > 0
          ? parent.students.reduce((acc, s) => acc + Number(s.progressRate || 0), 0) / totalChildren
          : 0;

    // 3. Child Progress Overviews
    const children =
      parent.students?.map((s) => {
        const prog = progressByStudent[s.id];
        const memorization = prog?.progressPercentage ?? Number(s.progressRate || 0);
        return {
          id: s.id,
          name: s.fullName,
          photo: s.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName}`,
          level: s.level || 'Juz 30 (Amma)',
          teacher: s.teacher?.fullName || 'Sheikh Abdullah',
          attendance: Number(s.attendanceRate || 99),
          memorization,
          currentSurah: prog?.lastStudiedSurah || 'Not started',
          currentAyah: prog?.lastStudiedAyah || 0,
          currentPage: prog?.lastStudiedPage || 0,
          status: s.status?.toUpperCase() || 'ACTIVE',
          recentLogs: (logsByStudent[s.id] || []).map((log) => ({
            id: log.id,
            surahName: log.surahName,
            lastStudiedPage: log.lastStudiedPage,
            lastStudiedAyah: log.lastStudiedAyah,
            teacherName: log.teacher?.fullName || 'Teacher',
            date: log.createdAt,
          })),
        };
      }) || [];

    // 4. Recent Activities & Detailed Feedbacks
    let activities = [];
    let feedbacks = [];
    if (totalChildren > 0) {
      const recentFeedback = await this.feedbackRepository.find({
        where: { studentId: In(studentIds) },
        order: { createdAt: 'DESC' },
        relations: ['teacher', 'student'],
      });

      activities = recentFeedback.slice(0, 5).map((f) => ({
        id: f.id,
        type: 'Feedback',
        title: 'Progress Report',
        content: `${f.teacher?.fullName || 'Teacher'} sent a progress report for ${f.student?.fullName || 'student'}`,
        date: f.createdAt,
      }));

      feedbacks = recentFeedback.map((f) => ({
        id: f.id,
        content: f.content,
        createdAt: f.createdAt,
        studentId: f.studentId,
        childName: f.student?.fullName || 'Child',
        teacherName: f.teacher?.fullName || 'Teacher',
      }));
    }

    // 5. Schedules (All Schedules for Children)
    let schedules = [];
    if (totalChildren > 0) {
      const allSchedules = await this.schedulesRepository.find({
        where: { studentId: In(studentIds) },
        relations: ['teacher', 'student'],
      });

      schedules = allSchedules.map((sc) => ({
        id: sc.id,
        studentId: sc.studentId,
        childName: sc.student?.fullName || 'Child',
        className: sc.className,
        teacher: sc.teacher?.fullName || 'Teacher',
        dayOfWeek: sc.dayOfWeek,
        startTimeString: sc.startTimeString,
        endTimeString: sc.endTimeString,
        time:
          sc.startTimeString && sc.endTimeString
            ? `${sc.startTimeString} - ${sc.endTimeString}`
            : '',
        meetingLink: sc.meetingLink,
        status: sc.status,
      }));
    }

    // 6. Homework list
    let homeworkList = [];
    if (totalChildren > 0) {
      const allHomework = await this.homeworkRepository.find({
        where: { studentId: In(studentIds) },
        order: { dueDate: 'DESC' },
        relations: ['student'],
      });
      homeworkList = allHomework.map((h) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        difficulty: h.difficulty,
        status: h.status,
        dueDate: h.dueDate,
        studentId: h.studentId,
        childName: h.student?.fullName || 'Child',
      }));
    }

    return {
      parent: {
        id: parent.id,
        name: parent.fullName,
        email: parent.email,
        photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + parent.fullName,
      },
      stats: {
        totalChildren,
        activeClasses,
        attendanceRate: avgAttendance.toFixed(1),
        memorizationProgress: avgProgress.toFixed(0),
        pendingHomework: pendingHomework,
        upcomingExams,
      },
      children,
      activities,
      schedules,
      homework: homeworkList,
      feedbacks,
    };
  }
}

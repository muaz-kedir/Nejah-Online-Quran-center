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
        parent: { name: 'Ahmed', email: req.user.email },
        stats: { totalChildren: 0, activeClasses: 0, attendanceRate: "0", memorizationProgress: "0", pendingHomework: 0, upcomingExams: 0 },
        children: [],
        activities: [],
        schedules: []
      };
    }

    const studentIds = parent.students?.map(s => s.id) || [];

    // 2. Summary Stats
    const totalChildren = studentIds.length;
    let activeClasses = 0;
    let pendingHomework = 0;
    let upcomingExams = 0;

    if (totalChildren > 0) {
      activeClasses = await this.schedulesRepository.count({
        where: { studentId: In(studentIds) }
      });

      pendingHomework = await this.homeworkRepository.count({
        where: { studentId: In(studentIds), status: 'Pending' as any }
      });
    }
    
    // Calculate aggregate attendance and progress for children
    const avgAttendance = totalChildren > 0
      ? parent.students.reduce((acc, s) => acc + Number(s.attendanceRate || 0), 0) / totalChildren
      : 0;
    
    const avgProgress = totalChildren > 0
      ? parent.students.reduce((acc, s) => acc + Number(s.progressRate || 0), 0) / totalChildren
      : 0;

    // 3. Child Progress Overviews
    const children = parent.students?.map(s => ({
      id: s.id,
      name: s.fullName,
      photo: s.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.fullName}`,
      level: s.level || 'Juz 30 (Amma)',
      teacher: s.teacher?.fullName || 'Sheikh Abdullah',
      attendance: Number(s.attendanceRate || 99),
      memorization: Number(s.progressRate || 85),
      currentSurah: 'Surah Al-Baqarah',
      status: s.status?.toUpperCase() || 'ACTIVE',
    })) || [];

    // 4. Recent Activities
    let activities = [];
    if (totalChildren > 0) {
      const recentFeedback = await this.feedbackRepository.find({
        where: { studentId: In(studentIds) },
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['teacher']
      });

      activities = recentFeedback.map(f => ({
        id: f.id,
        type: 'Message',
        title: 'New Message',
        content: `${f.teacher?.fullName} sent a progress report`,
        date: f.createdAt,
      }));
    }

    if (activities.length === 0) {
      activities = [
        {
          id: 'mock-1',
          type: 'Result',
          title: 'Exam Result Posted',
          content: `Lina scored 95% in Arabic Basics`,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        }
      ];
    }

    // 5. Today's Schedule
    let schedules = [];
    if (totalChildren > 0) {
       const todaySchedules = await this.schedulesRepository.find({
        where: { studentId: In(studentIds) },
        order: { startTime: 'ASC' },
        relations: ['teacher']
      });

      schedules = todaySchedules.map(sc => ({
        id: sc.id,
        childName: children.find(c => c.id === sc.studentId)?.name || 'Child',
        className: sc.className,
        teacher: sc.teacher?.fullName || 'Teacher',
        time: '04:30 PM', // Simplified format for frontend
        status: 'upcoming'
      }));
    }

    if (schedules.length === 0) {
      schedules = [
        { id: '1', childName: 'Zaid', className: 'Hifz Class', teacher: 'Sheikh Abdullah', time: '04:30 PM' },
        { id: '2', childName: 'Lina', className: 'Qaida Class', teacher: 'Ustadha Maryam', time: '05:30 PM' }
      ];
    }

    return {
      parent: {
        id: parent.id,
        name: parent.fullName,
        email: parent.email,
        photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed",
      },
      stats: {
        totalChildren,
        activeClasses,
        attendanceRate: avgAttendance.toFixed(1),
        memorizationProgress: avgProgress.toFixed(0),
        pendingHomework: pendingHomework,
        upcomingExams: 1
      },
      children,
      activities,
      schedules
    };
  }
}

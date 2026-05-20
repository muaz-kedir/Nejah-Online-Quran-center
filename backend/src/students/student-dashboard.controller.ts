import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Student } from './entities/student.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Feedback } from '../progress/entities/feedback.entity';

@Controller('student/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentDashboardController {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
  ) {}

  @Get()
  async getDashboardData(@Request() req) {
    const userId = req.user.id;

    // 1. Get student profile
    const student = await this.studentsRepository.findOne({
      where: { userId },
      relations: ['teacher', 'teacher.user'],
    });

    if (!student) {
      return { message: 'Student profile not found' };
    }

    const studentId = student.id;

    // 2. Get progress
    let progress = await this.progressRepository.findOne({ where: { studentId } });
    if (!progress) {
      // Mock some initial progress if none exists
      progress = {
        surahsCount: 24,
        ayahsCount: 482,
        weeksActive: 12,
        progressPercentage: 65,
        rank: 'Mumtaz',
      } as Progress;
    }

    // 3. Get upcoming class
    const upcomingClass = await this.scheduleRepository.findOne({
      where: { studentId },
      order: { startTime: 'ASC' },
      relations: ['teacher', 'teacher.user'],
    });

    // 4. Get pending tasks
    const pendingTasks = await this.homeworkRepository.find({
      where: { studentId },
      order: { dueDate: 'ASC' },
      take: 2,
    });

    // 5. Get attendance (last 7 days)
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    // In a real app we'd fetch actual records, for now we return a summary
    const attendance = [
      { day: 'S', present: true },
      { day: 'M', present: true },
      { day: 'T', present: false },
      { day: 'W', present: true },
      { day: 'T', present: true },
      { day: 'F', present: false },
      { day: 'S', present: true },
    ];

    // 6. Get latest feedback
    const latestFeedback = await this.feedbackRepository.findOne({
      where: { studentId },
      order: { createdAt: 'DESC' },
      relations: ['teacher', 'teacher.user'],
    });

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        studentCode: student.studentCode,
        avatarUrl: student.avatarUrl,
        level: student.level,
      },
      progress: {
        surahs: progress.surahsCount,
        ayahs: progress.ayahsCount,
        weeksActive: progress.weeksActive,
        percentage: progress.progressPercentage,
        rank: progress.rank,
      },
      upcomingClass: upcomingClass ? {
        id: upcomingClass.id,
        name: upcomingClass.className,
        teacher: upcomingClass.teacher?.fullName,
        startTime: upcomingClass.startTime,
        meetingLink: upcomingClass.meetingLink,
      } : {
        name: 'Tajweed Level 2',
        teacher: 'Ustadha Mariam',
        time: 'Today at 4:00 PM',
        meetingLink: '#',
      },
      pendingTasks: pendingTasks.length > 0 ? pendingTasks : [
        {
          id: '1',
          title: 'Recite Surah Al-Kahf',
          description: 'Complete your Friday Sunnah recitation with proper Makharij.',
          difficulty: 'Medium',
          status: 'Pending',
          dueDate: 'Tomorrow',
          icon: 'book',
        },
        {
          id: '2',
          title: 'Memorize 5 Ayahs',
          description: 'Al-Baqarah, Verses 255-260. Focus on fluent transition.',
          difficulty: 'High',
          status: 'Pending',
          dueDate: '2 days left',
          icon: 'brain',
        }
      ],
      attendance,
      feedback: latestFeedback ? {
        content: latestFeedback.content,
        teacher: latestFeedback.teacher?.fullName,
        date: latestFeedback.createdAt,
      } : {
        content: "Excellent progress on the long vowels today, Zaid! Your pronunciation of the 'Mad' rules in Surah Al-Fath was very consistent. Keep practicing those breath controls.",
        teacher: 'Ustadha Mariam',
        date: 'Yesterday at 5:15 PM',
      },
      verseOfTheDay: {
        arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا',
        translation: '"And say, \'My Lord, increase me in knowledge.\' "',
        reference: 'Surah Taha [20:114]',
      }
    };
  }
}

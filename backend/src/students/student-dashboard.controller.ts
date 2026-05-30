import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Feedback } from '../progress/entities/feedback.entity';
import { Homework } from '../homework/entities/homework.entity';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentDashboardController {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
  ) {}

  @Get('dashboard')
  async getDashboard(@Request() req) {
    const userId = req.user.id;

    const student = await this.studentsRepository.findOne({
      where: { userId },
      relations: ['teacher'],
    });

    if (!student) {
      return { message: 'Student profile not found' };
    }

    const studentId = student.id;

    const progressRecord = await this.progressRepository.findOne({
      where: { studentId },
    });

    const attendances = await this.attendanceRepository.find({
      where: { studentId },
    });
    const totalClasses = attendances.length;
    const attendedClasses = attendances.filter(a => a.isPresent).length;
    const attendanceRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    const weeklyAttendance = days.map(day => {
      const record = attendances.find(a => new Date(a.date).toISOString().split('T')[0] === day);
      return { date: day, present: record ? record.isPresent : false, session: record ? 'Quran Class' : null };
    });

    const schedules = await this.schedulesRepository.find({
      where: { studentId },
      order: { startTimeString: 'ASC' },
    });

    const homeworkAssignments = await this.homeworkRepository.find({
      where: { student: { id: studentId } },
      order: { dueDate: 'ASC' },
    });

    const homeworkOverdue = homeworkAssignments.filter(
      h => h.status === 'Pending' && new Date(h.dueDate) < new Date(),
    ).length;
    const homeworkCompleted = homeworkAssignments.filter(h => h.status === 'Completed').length;
    const homeworkPendingCount = homeworkAssignments.filter(h => h.status === 'Pending').length;

    const feedbackRecords = await this.feedbackRepository.find({
      where: { studentId },
      relations: ['teacher'],
      order: { createdAt: 'DESC' },
      take: 1,
    });

    const surahsCount = progressRecord?.surahsCount || 0;
    const percentage = progressRecord?.progressPercentage || 0;

    const pendingTasks = homeworkAssignments.filter(h => h.status === 'Pending').slice(0, 4).map((h, i) => ({
      id: h.id || `task-${i}`,
      title: h.title,
      description: h.description || `Due ${h.dueDate ? new Date(h.dueDate).toLocaleDateString() : 'soon'}`,
      dueDate: h.dueDate ? new Date(h.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Soon',
      icon: i % 2 === 0 ? 'book' : 'brain',
      difficulty: h.status === 'Pending' ? 'Medium' : 'Completed',
    }));

    const nextSchedule = schedules.length > 0 ? {
      id: schedules[0].id,
      name: schedules[0].className || 'Quran Class',
      teacher: student.teacher?.fullName || 'Assigned Teacher',
      time: schedules[0].startTimeString && schedules[0].endTimeString
        ? `Today at ${schedules[0].startTimeString}`
        : 'Today',
    } : null;

    const feedback = feedbackRecords.length > 0 ? {
      teacher: feedbackRecords[0].teacher?.fullName || 'Teacher',
      date: feedbackRecords[0].createdAt
        ? new Date(feedbackRecords[0].createdAt).toLocaleDateString()
        : '',
      content: feedbackRecords[0].content,
    } : null;

    return {
      student: {
        id: student.id,
        name: student.fullName,
        fullName: student.fullName,
        initials: student.fullName.split(' ').map(n => n[0]).join(''),
        email: student.email,
        level: student.level || 'Beginner',
        attendanceRate,
        totalClasses,
        attendedClasses,
        avatarUrl: student.avatarUrl
          ? `http://localhost:3000${student.avatarUrl}`
          : null,
      },
      progress: {
        surahsCompleted: surahsCount,
        surahs: surahsCount,
        totalSurahs: 114,
        currentSurah: progressRecord?.lastStudiedSurah || 'Not started',
        percentage,
        rank: progressRecord?.rank || 'Beginner',
        lastStudiedSurah: progressRecord?.lastStudiedSurah || 'Not started',
        ayahs: progressRecord?.ayahsCount || 0,
        weeksActive: progressRecord?.weeksActive || 0,
      },
      attendance: { totalClasses, attendedClasses, rate: attendanceRate, weekly: weeklyAttendance },
      schedule: schedules.map(s => ({
        id: s.id,
        day: s.dayOfWeek || '',
        time: s.startTimeString && s.endTimeString ? `${s.startTimeString} - ${s.endTimeString}` : '',
        subject: s.className || 'Quran Class',
        teacher: student.teacher?.fullName || 'Assigned Teacher',
      })),
      homework: {
        overdue: homeworkOverdue,
        completed: homeworkCompleted,
        pending: homeworkPendingCount,
        recent: homeworkAssignments.slice(0, 3).map(h => ({
          id: h.id,
          title: h.title,
          subject: 'Quran',
          dueDate: h.dueDate ? new Date(h.dueDate).toLocaleDateString() : '',
          status: h.status,
          description: h.description,
        })),
      },
      upcomingClass: nextSchedule,
      pendingTasks,
      feedback,
    };
  }

  @Get('dashboard/classes')
  async getClasses(@Request() req) {
    const userId = req.user.id;
    const student = await this.studentsRepository.findOne({ where: { userId }, relations: ['teacher'] });
    if (!student) return [];

    const schedules = await this.schedulesRepository.find({
      where: { studentId: student.id },
      order: { dayOfWeek: 'ASC', startTimeString: 'ASC' },
    });

    return schedules.map(s => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTimeString,
      endTime: s.endTimeString,
      className: s.className || 'Quran Class',
      classType: s.classType || '1:1 Session',
      teacherName: student.teacher?.fullName || 'Assigned Teacher',
      meetingLink: s.meetingLink,
      status: s.status,
    }));
  }

  @Get('dashboard/progress')
  async getProgress(@Request() req) {
    const userId = req.user.id;
    const student = await this.studentsRepository.findOne({ where: { userId } });
    if (!student) return { message: 'Student not found' };

    const progressRecord = await this.progressRepository.findOne({
      where: { studentId: student.id },
    });

    return progressRecord || { studentId: student.id, surahsCount: 0, progressPercentage: 0, rank: 'Beginner', lastStudiedSurah: null };
  }

  @Get('dashboard/homework')
  async getHomework(@Request() req) {
    const userId = req.user.id;
    const student = await this.studentsRepository.findOne({ where: { userId } });
    if (!student) return [];

    return this.homeworkRepository.find({
      where: { student: { id: student.id } },
      order: { dueDate: 'ASC' },
    });
  }
}

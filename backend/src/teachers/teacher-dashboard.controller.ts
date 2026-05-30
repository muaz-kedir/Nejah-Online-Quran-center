import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { Student, QuranLevel } from '../students/entities/student.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Homework } from '../homework/entities/homework.entity';
import { TeacherNote } from './entities/teacher-note.entity';
import { Progress } from '../progress/entities/progress.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Controller('teacher/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
export class TeacherDashboardController {
  constructor(
    @InjectRepository(Teacher)
    private teachersRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(TeacherNote)
    private notesRepository: Repository<TeacherNote>,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  @Get()
  async getDashboardData(@Request() req) {
    const userId = req.user.id;

    const teacher = await this.teachersRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!teacher) {
      return { message: 'Teacher profile not found' };
    }

    const teacherId = teacher.id;

    // Stats
    const totalStudents = await this.studentsRepository.count({ where: { teacherId } });
    const todayClassesCount = await this.schedulesRepository.count({ where: { teacherId } });

    const studentsRes = await this.studentsRepository.find({ where: { teacherId } });
    const avgAttendance = studentsRes.length > 0
      ? studentsRes.reduce((acc, s) => acc + Number(s.attendanceRate || 0), 0) / studentsRes.length
      : 0;

    const homeworkPending = await this.homeworkRepository.count({
      where: { student: { teacherId }, status: 'Pending' as any },
    });

    // Student progress with real progress data
    const studentIds = studentsRes.map(s => s.id);
    const progressRecords = studentIds.length > 0 ? await this.progressRepository.find({
      where: { studentId: In(studentIds) },
      order: { updatedAt: 'DESC' },
    }) : [];

    const progressMap = new Map(progressRecords.map(p => [p.studentId, p]));

    const studentProgress = studentsRes.map(s => {
      const prog = progressMap.get(s.id);
      const rate = prog?.progressPercentage ?? s.progressRate ?? 0;
      return {
        id: s.id,
        name: s.fullName,
        initials: s.fullName.split(' ').map(n => n[0]).join(''),
        currentSurah: prog?.lastStudiedSurah || (s.level === 'Hifz' ? 'Surah Al-Kahf (Juz 15)' : 'Juz Amma (Revision)'),
        status: rate >= 80 ? 'EXCEEDING' : rate >= 50 ? 'ON TRACK' : 'NEEDS REVIEW',
        progress: rate,
      };
    });

    // Real notes (no fallback)
    const notes = await this.notesRepository.find({
      where: { teacherId },
      order: { createdAt: 'DESC' },
      take: 3,
    });

    // Real sessions with proper time formatting
    const sessions = await this.schedulesRepository.find({
      where: { teacherId },
      order: { startTimeString: 'ASC' },
      relations: ['student'],
      take: 3,
    });

    const formattedSessions = sessions.map(s => ({
      id: s.id,
      time: s.startTimeString && s.endTimeString ? `${s.startTimeString} - ${s.endTimeString}` : '',
      title: s.className,
      type: s.classType || (s.student ? 'Private Hifz • 1:1 Session' : 'Group Session'),
      students: s.student ? [s.student.fullName] : [],
      status: s.status === 'active' ? 'READY TO START' : null,
    }));

    return {
      teacher: {
        id: teacher.id,
        name: teacher.fullName,
        title: teacher.specialization || 'Teacher',
        avatar: teacher.avatarUrl
          ? `http://localhost:3000${teacher.avatarUrl}`
          : null,
      },
      stats: {
        totalStudents,
        todayClasses: todayClassesCount,
        overallAttendance: Number(avgAttendance.toFixed(1)),
        homeworkPending,
      },
      studentProgress,
      notes: notes.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt ? n.createdAt.toISOString() : null,
      })),
      sessions: formattedSessions,
    };
  }

  @Get('today-sessions')
  async getTodaySessions(@Request() req) {
    const userId = req.user.id;

    const teacher = await this.teachersRepository.findOne({ where: { userId } });
    if (!teacher) return [];

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    const sessions = await this.schedulesRepository.find({
      where: { teacherId: teacher.id, dayOfWeek: currentDay, status: 'active' },
      order: { startTimeString: 'ASC' },
      relations: ['student'],
    });

    return sessions.map(s => ({
      scheduleId: s.id,
      title: s.className || 'Quran Class',
      studentName: s.student?.fullName || 'Unknown Student',
      studentAvatar: s.student?.fullName ? s.student.fullName.charAt(0) : 'U',
      sessionType: s.classType || '1:1 Session',
      startTime: s.startTimeString,
      endTime: s.endTimeString,
      meetingLink: s.meetingLink,
      status: s.status,
      level: s.student?.level || 'Beginner',
    }));
  }

  private async getTeacherFromRequest(req: any) {
    const userId = req.user.id;
    return this.teachersRepository.findOne({ where: { userId } });
  }

  @Get('notes')
  async getNotes(@Request() req) {
    const teacher = await this.getTeacherFromRequest(req);
    if (!teacher) return [];
    return this.notesRepository.find({
      where: { teacherId: teacher.id },
      order: { createdAt: 'DESC' },
    });
  }

  @Post('notes')
  async createNote(@Request() req, @Body() body: { title: string; content: string; type: string }) {
    const teacher = await this.getTeacherFromRequest(req);
    if (!teacher) return { error: 'Teacher not found' };
    const note = this.notesRepository.create({
      teacherId: teacher.id,
      title: body.title,
      content: body.content,
      type: body.type as any,
    });
    return this.notesRepository.save(note);
  }

  @Patch('notes/:id')
  async updateNote(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; type?: string },
  ) {
    const teacher = await this.getTeacherFromRequest(req);
    if (!teacher) return { error: 'Teacher not found' };
    const note = await this.notesRepository.findOne({ where: { id, teacherId: teacher.id } });
    if (!note) return { error: 'Note not found' };
    Object.assign(note, body);
    return this.notesRepository.save(note);
  }

  @Delete('notes/:id')
  async deleteNote(@Request() req, @Param('id') id: string) {
    const teacher = await this.getTeacherFromRequest(req);
    if (!teacher) return { error: 'Teacher not found' };
    const note = await this.notesRepository.findOne({ where: { id, teacherId: teacher.id } });
    if (!note) return { error: 'Note not found' };
    await this.notesRepository.remove(note);
    return { success: true };
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './entities/teacher.entity';
import { TeacherNote } from './entities/teacher-note.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { TeachersService } from './teachers.service';
import { ScheduleSessionGeneratorService } from '../zoom/schedule-session-generator.service';
import { LiveSessionStatus } from '../zoom/enums/live-session-status.enum';
import { getDayNameInZone } from '../common/utils/app-timezone.util';

@Controller('teacher/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
export class TeacherDashboardController {
  constructor(
    @InjectRepository(TeacherNote)
    private notesRepository: Repository<TeacherNote>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    private teachersService: TeachersService,
    private scheduleSessionGenerator: ScheduleSessionGeneratorService,
  ) {}

  private async requireTeacher(req: { user: { id: string } }): Promise<Teacher> {
    return this.teachersService.resolveAuthenticatedTeacher(req.user.id);
  }

  @Get()
  async getDashboardData(@Request() req) {
    const teacher = await this.requireTeacher(req);
    const data = await this.teachersService.getTeacherDashboardData(teacher.id);

    // Add notes (kept separately for simpler query)
    const notes = await this.notesRepository.find({
      where: { teacherId: teacher.id },
      order: { createdAt: 'DESC' },
      take: 3,
    });

    return {
      ...data,
      notes: notes.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt ? n.createdAt.toISOString() : null,
      })),
      teacher: {
        ...data.teacher,
        name: data.teacher.fullName,
        title: data.teacher.specialization || 'Teacher',
        avatar: data.teacher.avatarUrl
            ? data.teacher.avatarUrl.startsWith('http')
              ? data.teacher.avatarUrl
              : `${process.env.API_BASE_URL || 'https://nejah-online-quran-center.onrender.com'}${data.teacher.avatarUrl}`
          : null,
      },
    };
  }

  @Get('search')
  async searchData(@Request() req, @Query('q') query: string) {
    const teacher = await this.requireTeacher(req);
    return this.teachersService.searchTeacherData(teacher.id, query);
  }

  @Get('recent-activities')
  async getRecentActivities(@Request() req) {
    const teacher = await this.requireTeacher(req);
    const students = await this.teachersService.getTeacherStudents(teacher.id, 1, 1000);
    const studentIds = students.data.map((s: any) => s.id);
    return this.teachersService.getRecentActivities(teacher.id, studentIds, 20);
  }

  @Get('upcoming-tasks')
  async getUpcomingTasks(@Request() req) {
    const teacher = await this.requireTeacher(req);
    const students = await this.teachersService.getTeacherStudents(teacher.id, 1, 1000);
    const studentIds = students.data.map((s: any) => s.id);
    return this.teachersService.getUpcomingTasks(teacher.id, studentIds);
  }

  @Get('today-sessions')
  async getTodaySessions(@Request() req) {
    const teacher = await this.requireTeacher(req);

    const currentDay = getDayNameInZone(new Date());

    const sessions = await this.schedulesRepository.find({
      where: { teacherId: teacher.id, dayOfWeek: currentDay, status: 'active' },
      order: { startTimeString: 'ASC' },
      relations: ['student', 'scheduleStudents', 'scheduleStudents.student'],
    });

    const results = await Promise.all(
      sessions.map(async (s) => {
        const groupStudents = (s.scheduleStudents || [])
          .map((ss) => ss.student)
          .filter(Boolean)
          .map((student) => ({
            id: student.id,
            fullName: student.fullName,
            level: student.level,
          }));

        const isGroupSession = !!s.isGroupSession;
        const studentCount = isGroupSession ? groupStudents.length : 1;

        const liveSession = await this.scheduleSessionGenerator.getTodaySessionForSchedule(s.id);
        const now = new Date();
        const scheduledStart = liveSession?.scheduledStart ? new Date(liveSession.scheduledStart) : null;
        const msUntilStart = scheduledStart ? scheduledStart.getTime() - now.getTime() : null;

        const joinWindowMinutes = liveSession?.joinWindowOpenMinutes ?? 15;
        const readyThresholdMs = joinWindowMinutes * 60 * 1000;

        let sessionPhase: 'upcoming' | 'ready' | 'live' | 'completed' = 'upcoming';
        if (liveSession?.status === LiveSessionStatus.LIVE) {
          sessionPhase = 'live';
        } else if (liveSession?.status === LiveSessionStatus.COMPLETED) {
          sessionPhase = 'completed';
        } else if (msUntilStart !== null && msUntilStart <= readyThresholdMs) {
          sessionPhase = 'ready';
        }

        return {
          scheduleId: s.id,
          liveSessionId: liveSession?.id || null,
          sessionStatus: liveSession?.status || null,
          sessionPhase,
          countdownMinutes: msUntilStart !== null ? Math.max(0, Math.ceil(msUntilStart / 60000)) : null,
          scheduledStart: liveSession?.scheduledStart || null,
          title: s.className || 'Quran Class',
          isGroupSession,
          studentCount,
          students: isGroupSession
            ? groupStudents
            : s.student
              ? [{ id: s.student.id, fullName: s.student.fullName, level: s.student.level }]
              : [],
          studentName: isGroupSession
            ? `Group · ${studentCount} students`
            : s.student?.fullName || 'Unknown Student',
          studentAvatar: isGroupSession
            ? 'G'
            : s.student?.fullName
              ? s.student.fullName.charAt(0)
              : 'U',
          sessionType: isGroupSession ? 'Group Session' : s.classType || '1:1 Session',
          startTime: s.startTimeString,
          endTime: s.endTimeString,
          meetingLink: liveSession?.zoomJoinUrl || s.meetingLink,
          status: s.status,
          level: isGroupSession
            ? groupStudents[0]?.level || 'Beginner'
            : s.student?.level || 'Beginner',
        };
      }),
    );

    return results.filter((s) => s.sessionPhase !== 'completed');
  }

  @Get('notes')
  async getNotes(@Request() req) {
    const teacher = await this.requireTeacher(req);
    return this.notesRepository.find({
      where: { teacherId: teacher.id },
      order: { createdAt: 'DESC' },
    });
  }

  @Post('notes')
  async createNote(@Request() req, @Body() body: { title: string; content: string; type: string }) {
    const teacher = await this.requireTeacher(req);
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
    const teacher = await this.requireTeacher(req);
    const note = await this.notesRepository.findOne({
      where: { id, teacherId: teacher.id },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    Object.assign(note, body);
    return this.notesRepository.save(note);
  }

  @Delete('notes/:id')
  async deleteNote(@Request() req, @Param('id') id: string) {
    const teacher = await this.requireTeacher(req);
    const note = await this.notesRepository.findOne({
      where: { id, teacherId: teacher.id },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    await this.notesRepository.remove(note);
    return { success: true };
  }
}

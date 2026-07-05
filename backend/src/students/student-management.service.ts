import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { SchedulesService } from '../schedules/schedules.service';
import { CreateScheduleDto } from '../schedules/dto/create-schedule.dto';
import { TeacherReplacementsService } from '../teacher-replacements/teacher-replacements.service';
import { CreateTeacherReplacementDto } from '../teacher-replacements/dto/create-teacher-replacement.dto';
import { ProgressService } from '../progress/progress.service';
import { SessionAttendance } from '../zoom/entities/session-attendance.entity';
import { LiveSession } from '../zoom/entities/live-session.entity';
import { TeacherReplacement } from '../teacher-replacements/entities/teacher-replacement.entity';
import { ReplacementStatus } from '../common/enums/replacement-status.enum';
import { AttendanceStatus } from '../zoom/enums/live-session-status.enum';
import {
  getAppTimezone,
  getDayNameInZone,
  startOfDayInZone,
} from '../common/utils/app-timezone.util';
import { formatTopicLabel, resolveLearningTrack } from '../common/constants/learning-curricula';

type AttendancePeriod = 'daily' | 'weekly' | 'monthly' | 'annual';

function durationMinutesFromTimes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

function formatTime(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

@Injectable()
export class StudentManagementService {
  constructor(
    @InjectRepository(Student)
    private readonly studentsRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teachersRepository: Repository<Teacher>,
    @InjectRepository(SessionAttendance)
    private readonly sessionAttendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(TeacherReplacement)
    private readonly replacementsRepository: Repository<TeacherReplacement>,
    private readonly schedulesService: SchedulesService,
    private readonly replacementsService: TeacherReplacementsService,
    private readonly progressService: ProgressService,
  ) {}

  async getAssignedStudentsForTeacher(teacherId: string) {
    const teacher = await this.teachersRepository.findOne({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const students = await this.studentsRepository.find({
      where: { teacherId },
      order: { fullName: 'ASC' },
    });

    const rows = await Promise.all(
      students.map(async (student) => {
        let currentLesson = '—';
        try {
          const ctx = await this.progressService.getLearningContext(student.id);
          if (ctx.currentTopic?.label) {
            currentLesson = ctx.currentTopic.label;
          } else if (ctx.suggestedTopic?.label) {
            currentLesson = ctx.suggestedTopic.label;
          } else if (ctx.lastPosition?.lastStudiedSurah) {
            currentLesson = ctx.lastPosition.lastStudiedSurah;
          }
        } catch {
          // progress optional
        }

        return {
          id: student.id,
          studentCode: student.studentCode || student.id.slice(0, 8).toUpperCase(),
          fullName: student.fullName,
          level: student.level,
          currentLesson,
          country: student.country || student.currentResidency || '—',
          status: student.status,
          assignedDate: student.updatedAt || student.createdAt,
        };
      }),
    );

    return {
      teacher: { id: teacher.id, fullName: teacher.fullName },
      students: rows,
      total: rows.length,
    };
  }

  async getStudentAdminProfile(studentId: string) {
    const student = await this.studentsRepository.findOne({
      where: { id: studentId },
      relations: ['teacher'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const track = resolveLearningTrack(student.level);
    const ctx = await this.progressService.getLearningContext(studentId);

    return {
      id: student.id,
      studentCode: student.studentCode || student.id.slice(0, 8).toUpperCase(),
      fullName: student.fullName,
      teacherId: student.teacherId,
      teacherName: student.teacher?.fullName || 'Not assigned',
      level: student.level,
      currentCourse: ctx.learningTrackLabel,
      status: student.status,
      country: student.country || student.currentResidency || '—',
      currentLesson:
        ctx.currentTopic?.label ||
        ctx.suggestedTopic?.label ||
        ctx.lastPosition?.lastStudiedSurah ||
        '—',
    };
  }

  async getStudentSchedules(studentId: string) {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const schedules = await this.schedulesService.getStudentSchedules(studentId);
    const permanent = schedules.map((s) => ({
      id: s.id,
      day: s.dayOfWeek,
      startTime: s.startTimeString,
      endTime: s.endTimeString,
      durationMinutes: durationMinutesFromTimes(s.startTimeString, s.endTimeString),
      teacherId: s.teacherId,
      teacherName: s.teacher?.fullName || '—',
      scheduleType: 'Permanent',
      status: this.mapScheduleStatus(s.status),
      className: s.className,
      isGroupSession: s.isGroupSession,
      raw: s,
    }));

    const replacements = await this.replacementsRepository.find({
      where: {
        studentId,
        status: In([
          ReplacementStatus.ACTIVE,
          ReplacementStatus.UPCOMING,
          ReplacementStatus.COMPLETED,
        ]),
      },
      relations: ['originalTeacher', 'replacementTeacher'],
      order: { startDate: 'DESC' },
    });

    const temporary = replacements.map((r) => ({
      id: r.id,
      day: `${r.startDate} – ${r.endDate}`,
      startTime: r.startTimeString || '—',
      endTime: r.endTimeString || '—',
      durationMinutes:
        r.startTimeString && r.endTimeString
          ? durationMinutesFromTimes(r.startTimeString, r.endTimeString)
          : null,
      teacherId: r.replacementTeacherId,
      teacherName: r.replacementTeacher?.fullName || '—',
      originalTeacherName: r.originalTeacher?.fullName || '—',
      scheduleType: 'Temporary Replacement',
      status: this.mapReplacementStatus(r.status),
      startDate: r.startDate,
      endDate: r.endDate,
      reason: r.reason,
      raw: r,
    }));

    return {
      studentId,
      items: [...permanent, ...temporary],
      permanent,
      temporary,
    };
  }

  async createPermanentSchedule(
    studentId: string,
    dto: Omit<CreateScheduleDto, 'studentId'>,
    userId: string,
  ) {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    if (!student.teacherId) {
      throw new BadRequestException('Student must be assigned to a teacher before adding a schedule');
    }

    const payload: CreateScheduleDto = {
      ...dto,
      teacherId: dto.teacherId || student.teacherId,
      studentId,
      isGroupSession: false,
    };

    return this.schedulesService.createSchedule(payload);
  }

  async createTemporarySchedule(
    studentId: string,
    dto: CreateTeacherReplacementDto,
    userId: string,
  ) {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student?.teacherId) {
      throw new NotFoundException('Student or assigned teacher not found');
    }

    const payload: CreateTeacherReplacementDto = {
      ...dto,
      originalTeacherId: dto.originalTeacherId || student.teacherId,
      studentIds: [studentId],
    };

    return this.replacementsService.create(payload, userId);
  }

  async getStudentAttendance(studentId: string, period: AttendancePeriod = 'monthly') {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const { start, end } = this.getAttendanceRange(period);

    const attendances = await this.sessionAttendanceRepository.find({
      where: { studentId },
      relations: ['session', 'session.teacher', 'student'],
      order: { createdAt: 'DESC' },
    });

    const filtered = attendances.filter((a) => {
      const sessionStart = a.session?.scheduledStart;
      if (!sessionStart) return false;
      const t = sessionStart.getTime();
      return t >= start.getTime() && t <= end.getTime();
    });

    const rows = filtered.map((a) => {
      const session = a.session;
      const sessionStart = session?.scheduledStart;
      const sessionEnd =
        session?.actualEnd || session?.scheduledEnd || a.leaveTime || a.lastLeaveTime;
      const joinTime = a.joinTime || a.firstJoinTime;
      const endTime = sessionEnd;

      let durationMinutes: number | null = null;
      if (joinTime && endTime) {
        durationMinutes = Math.max(
          0,
          Math.round((endTime.getTime() - joinTime.getTime()) / 60000),
        );
      } else if (a.duration) {
        durationMinutes = a.duration;
      }

      const isPresent =
        a.attendanceStatus === AttendanceStatus.PRESENT ||
        a.attendanceStatus === AttendanceStatus.LATE ||
        a.attendanceStatus === AttendanceStatus.LEFT_EARLY ||
        a.attendanceStatus === AttendanceStatus.PARTIAL;

      return {
        id: a.id,
        sessionId: a.sessionId,
        date: sessionStart ? sessionStart.toISOString().slice(0, 10) : null,
        day: sessionStart ? getDayNameInZone(sessionStart, getAppTimezone()) : '—',
        studentName: student.fullName,
        startTime: formatTime(joinTime),
        endTime: formatTime(endTime),
        sessionDurationMinutes: durationMinutes,
        attendanceStatus: isPresent ? 'Present' : 'Absent',
        rawStatus: a.attendanceStatus,
        teacherName: session?.teacher?.fullName || '—',
      };
    });

    return {
      studentId,
      period,
      range: { start, end },
      records: rows,
      total: rows.length,
    };
  }

  async getStudentProgress(studentId: string) {
    const student = await this.studentsRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const learningContext = await this.progressService.getLearningContext(studentId);
    const progress = await this.progressService.getOrCreateProgress(studentId);
    const logs = await this.progressService.getStudentLogs(studentId, 20);
    const feedback = await this.progressService.getStudentFeedback(studentId);

    const track = learningContext.learningTrack;
    const completedIds = learningContext.completedTopicIds || [];
    const completedLessons = learningContext.topics?.filter((t: any) => t.isCompleted) || [];
    const remainingLessons = learningContext.topics?.filter((t: any) => !t.isCompleted) || [];

    let latestEvaluation: { notes?: string; createdAt?: Date } | null = null;
    const recentLog = logs[0];
    if (recentLog) {
      latestEvaluation = {
        notes: recentLog.notes ?? undefined,
        createdAt: recentLog.createdAt,
      };
    }

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        level: student.level,
        studentCode: student.studentCode,
      },
      learningContext,
      progress,
      progressPercentage: learningContext.progressSummary?.percentage ?? progress.progressPercentage,
      completedLessons: completedLessons.map((t: any) => t.label || formatTopicLabel(t)),
      remainingLessons: remainingLessons.map((t: any) => t.label || formatTopicLabel(t)),
      teacherFeedback: feedback,
      latestEvaluation,
      progressTimeline: logs,
      trackSpecific: this.buildTrackSpecificSummary(track, learningContext, progress),
    };
  }

  private buildTrackSpecificSummary(track: string, ctx: any, progress: any) {
    switch (track) {
      case 'qaidah':
        return {
          type: 'qaidah',
          completedTopics: ctx.completedTopicIds?.length || 0,
          totalTopics: ctx.topics?.length || 0,
          currentTopic: ctx.currentTopic?.label,
        };
      case 'quran_reading':
        return {
          type: 'quran_reading',
          surah: progress.lastStudiedSurah,
          surahNumber: progress.surahNumber,
          page: progress.lastStudiedPage,
          ayah: progress.lastStudiedAyah,
          surahsCompleted: progress.surahsCount,
        };
      case 'tajweed':
        return {
          type: 'tajweed',
          topicsCompleted: ctx.completedTopicIds?.length || 0,
          remaining: ctx.progressSummary?.remaining || 0,
          evaluationScore: progress.progressPercentage,
        };
      case 'hifz':
        return {
          type: 'hifz',
          memorizedSurahs: progress.surahsCount,
          memorizedAyahs: progress.ayahsCount,
          lastSurah: progress.lastStudiedSurah,
          memorizationPercentage: ctx.progressSummary?.percentage ?? progress.progressPercentage,
        };
      default:
        return { type: track };
    }
  }

  private getAttendanceRange(period: AttendancePeriod): { start: Date; end: Date } {
    const tz = getAppTimezone();
    const now = new Date();
    const end = new Date(now);
    let start: Date;

    switch (period) {
      case 'daily':
        start = startOfDayInZone(now, tz);
        break;
      case 'weekly':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        start = startOfDayInZone(now, tz);
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          year: 'numeric',
          month: 'numeric',
        }).formatToParts(now);
        const year = Number(parts.find((p) => p.type === 'year')?.value);
        const month = Number(parts.find((p) => p.type === 'month')?.value);
        start = new Date(Date.UTC(year, month - 1, 1));
        break;
      case 'annual':
        const yearParts = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          year: 'numeric',
        }).formatToParts(now);
        const y = Number(yearParts.find((p) => p.type === 'year')?.value);
        start = new Date(Date.UTC(y, 0, 1));
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  private mapScheduleStatus(status: string): string {
    if (status === 'active') return 'Active';
    if (status === 'inactive') return 'Cancelled';
    return status;
  }

  private mapReplacementStatus(status: ReplacementStatus): string {
    switch (status) {
      case ReplacementStatus.ACTIVE:
        return 'Active';
      case ReplacementStatus.COMPLETED:
        return 'Completed';
      case ReplacementStatus.CANCELLED:
        return 'Cancelled';
      case ReplacementStatus.UPCOMING:
        return 'Active';
      default:
        return String(status);
    }
  }
}

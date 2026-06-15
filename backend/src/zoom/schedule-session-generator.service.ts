import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Schedule } from '../schedules/entities/schedule.entity';
import { ScheduleStudent } from '../schedules/entities/schedule-student.entity';
import { LiveSession } from './entities/live-session.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { matchesDayOfWeek } from '../common/utils/day-of-week.util';
import { SessionAttendanceService } from './session-attendance.service';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class ScheduleSessionGeneratorService {
  private readonly logger = new Logger(ScheduleSessionGeneratorService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly schedulesRepository: Repository<Schedule>,
    @InjectRepository(ScheduleStudent)
    private readonly scheduleStudentsRepository: Repository<ScheduleStudent>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    private readonly sessionAttendanceService: SessionAttendanceService,
  ) {}

  /** Generate live sessions for active schedules over the next N days. */
  async generateUpcomingSessions(daysAhead = 7): Promise<number> {
    const schedules = await this.schedulesRepository.find({
      where: { status: 'active' },
      relations: ['scheduleStudents'],
    });

    let created = 0;
    const today = this.startOfDay(new Date());

    for (let offset = 0; offset <= daysAhead; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dayName = DAYS[date.getDay()];

      for (const schedule of schedules) {
        if (!matchesDayOfWeek(schedule.dayOfWeek, dayName)) continue;
        const session = await this.ensureSessionForSchedule(schedule, date);
        if (session) created++;
      }
    }

    if (created > 0) {
      this.logger.log(`Generated ${created} live session(s) for the next ${daysAhead} days`);
    }
    return created;
  }

  /** Ensure a single session exists for a schedule on a given calendar date. */
  async ensureSessionForSchedule(
    schedule: Schedule,
    date: Date,
  ): Promise<LiveSession | null> {
    const dayStart = this.startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const existing = await this.liveSessionRepository.findOne({
      where: {
        scheduleId: schedule.id,
        scheduledStart: Between(dayStart, dayEnd),
      },
    });

    if (existing) return null;

    const { scheduledStart, scheduledEnd } = this.buildSessionTimes(schedule, date);

    const session = this.liveSessionRepository.create({
      teacherId: schedule.teacherId,
      studentId: schedule.isGroupSession ? null : schedule.studentId,
      scheduleId: schedule.id,
      scheduledStart,
      scheduledEnd,
      status: LiveSessionStatus.SCHEDULED,
      metadata: {
        className: schedule.className || 'Quran Class',
        dayOfWeek: schedule.dayOfWeek,
        isGroupSession: schedule.isGroupSession,
      },
    });

    const saved = await this.liveSessionRepository.save(session);
    await this.seedAttendanceRecords(schedule, saved.id);
    return saved;
  }

  async getTodaySessionForSchedule(scheduleId: string): Promise<LiveSession | null> {
    const today = this.startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let session = await this.liveSessionRepository.findOne({
      where: {
        scheduleId,
        scheduledStart: Between(today, tomorrow),
      },
      relations: ['student', 'schedule', 'schedule.scheduleStudents', 'schedule.scheduleStudents.student'],
      order: { scheduledStart: 'ASC' },
    });

    if (!session) {
      const schedule = await this.schedulesRepository.findOne({
        where: { id: scheduleId, status: 'active' },
        relations: ['scheduleStudents'],
      });
      if (schedule && matchesDayOfWeek(schedule.dayOfWeek, DAYS[new Date().getDay()])) {
        session = await this.ensureSessionForSchedule(schedule, new Date());
        if (session) {
          session = await this.liveSessionRepository.findOne({
            where: { id: session.id },
            relations: ['student', 'schedule', 'schedule.scheduleStudents', 'schedule.scheduleStudents.student'],
          });
        }
      }
    }

    return session;
  }

  private async seedAttendanceRecords(schedule: Schedule, sessionId: string): Promise<void> {
    const studentIds: string[] = [];

    if (schedule.isGroupSession) {
      const members = schedule.scheduleStudents?.length
        ? schedule.scheduleStudents
        : await this.scheduleStudentsRepository.find({ where: { scheduleId: schedule.id } });
      studentIds.push(...members.map((m) => m.studentId));
    } else if (schedule.studentId) {
      studentIds.push(schedule.studentId);
    }

    if (studentIds.length > 0) {
      await this.sessionAttendanceService.bulkCreateAttendance(sessionId, studentIds);
    }
  }

  private buildSessionTimes(
    schedule: Schedule,
    date: Date,
  ): { scheduledStart: Date; scheduledEnd: Date } {
    const [startHour, startMin] = schedule.startTimeString.split(':').map(Number);
    const [endHour, endMin] = schedule.endTimeString.split(':').map(Number);
    const scheduledStart = new Date(date);
    scheduledStart.setHours(startHour, startMin, 0, 0);
    const scheduledEnd = new Date(date);
    scheduledEnd.setHours(endHour, endMin, 0, 0);
    return { scheduledStart, scheduledEnd };
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

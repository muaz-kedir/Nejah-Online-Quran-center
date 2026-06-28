import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Schedule } from '../schedules/entities/schedule.entity';
import { ScheduleStudent } from '../schedules/entities/schedule-student.entity';
import { LiveSession } from './entities/live-session.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { matchesDayOfWeek } from '../common/utils/day-of-week.util';
import {
  getAppTimezone,
  getDayNameInZone,
  startOfDayInZone,
  wallClockOnDateToUtc,
} from '../common/utils/app-timezone.util';
import { SessionAttendanceService } from './session-attendance.service';

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
    const today = startOfDayInZone(new Date(), getAppTimezone());

    for (let offset = 0; offset <= daysAhead; offset++) {
      const date = new Date(today.getTime() + offset * 86400000);
      const dayName = getDayNameInZone(date, getAppTimezone());

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
    const dayStart = startOfDayInZone(date, getAppTimezone());
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
    const today = startOfDayInZone(new Date(), getAppTimezone());
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
      if (schedule && matchesDayOfWeek(schedule.dayOfWeek, getDayNameInZone(new Date()))) {
        session = await this.ensureSessionForSchedule(schedule, new Date());
        if (session) {
          session = await this.liveSessionRepository.findOne({
            where: { id: session.id },
            relations: ['student', 'schedule', 'schedule.scheduleStudents', 'schedule.scheduleStudents.student'],
          });
        }
      }
    } else if (session.schedule) {
      session = await this.resyncSessionScheduleTimes(session);
    }

    return session;
  }

  /** Fix sessions stored with server-local hours instead of app timezone wall clock. */
  async resyncSessionScheduleTimes(session: LiveSession): Promise<LiveSession> {
    const schedule = session.schedule;
    if (!schedule?.startTimeString || !schedule?.endTimeString || !session.scheduledStart) {
      return session;
    }

    const tz = getAppTimezone();
    const anchor = session.scheduledStart;
    const newStart = wallClockOnDateToUtc(anchor, schedule.startTimeString, tz);
    const newEnd = wallClockOnDateToUtc(anchor, schedule.endTimeString, tz);
    const normalizedEnd =
      newEnd.getTime() <= newStart.getTime()
        ? new Date(newStart.getTime() + 60 * 60 * 1000)
        : newEnd;

    const startDrift = Math.abs(newStart.getTime() - session.scheduledStart.getTime());
    const endDrift = session.scheduledEnd
      ? Math.abs(normalizedEnd.getTime() - session.scheduledEnd.getTime())
      : Number.POSITIVE_INFINITY;

    if (startDrift > 60_000 || endDrift > 60_000 || !session.scheduledEnd) {
      session.scheduledStart = newStart;
      session.scheduledEnd = normalizedEnd;
      await this.liveSessionRepository.save(session);
      this.logger.log(
        `Resynced live session ${session.id} schedule times to ${tz} ` +
          `(${schedule.startTimeString}–${schedule.endTimeString})`,
      );
    }

    return session;
  }

  /** Re-align today's scheduled sessions with their schedule wall-clock times. */
  async resyncScheduledSessionsForToday(): Promise<number> {
    const today = startOfDayInZone(new Date(), getAppTimezone());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await this.liveSessionRepository.find({
      where: {
        status: LiveSessionStatus.SCHEDULED,
        scheduledStart: Between(today, tomorrow),
      },
      relations: ['schedule'],
    });

    let count = 0;
    for (const session of sessions) {
      if (session.schedule) {
        await this.resyncSessionScheduleTimes(session);
        count++;
      }
    }

    if (count > 0) {
      this.logger.log(`Resynced schedule times for ${count} session(s) today`);
    }

    return count;
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
    const tz = getAppTimezone();
    const scheduledStart = wallClockOnDateToUtc(date, schedule.startTimeString, tz);
    let scheduledEnd = wallClockOnDateToUtc(date, schedule.endTimeString, tz);
    if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
      scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000);
    }
    return { scheduledStart, scheduledEnd };
  }
}

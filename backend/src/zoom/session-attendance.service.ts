import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionAttendance } from './entities/session-attendance.entity';
import { LiveSession } from './entities/live-session.entity';
import { Student } from '../students/entities/student.entity';
import { AttendanceStatus } from './enums/live-session-status.enum';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';
import { TimelineEventType, TimelineEventSource } from './entities/participant-timeline-event.entity';
import { buildWebhookEventId } from './webhook-event-id.util';

@Injectable()
export class SessionAttendanceService {
  private readonly logger = new Logger(SessionAttendanceService.name);

  constructor(
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly attendanceIntelligence: AttendanceIntelligenceService,
  ) {}

  async recordJoin(
    sessionId: string,
    studentId: string,
    metadata?: { device?: string; clientType?: string; zoomUserId?: string; rawPayload?: any; webhookEventId?: string },
  ): Promise<SessionAttendance> {
    const session = await this.liveSessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const now = new Date();

    await this.attendanceIntelligence.appendTimelineEvent({
      sessionId,
      participantId: studentId,
      participantRole: 'student',
      zoomUserId: metadata?.zoomUserId,
      eventType: TimelineEventType.JOIN,
      timestamp: now,
      device: metadata?.device,
      clientType: metadata?.clientType,
      rawPayload: metadata?.rawPayload,
      webhookEventId:
        metadata?.webhookEventId ||
        buildWebhookEventId('app_join', sessionId, studentId, String(now.getTime())),
      source: TimelineEventSource.APP,
    });

    await this.attendanceIntelligence.openAttendanceSegment({
      sessionId,
      userId: student.userId,
      userEmail: student.email || student.zoomEmail || '',
      userType: 'student',
      zoomParticipantId: metadata?.zoomUserId,
      joinTime: now,
      source: 'app',
    });

    const attendance = await this.attendanceIntelligence.calculateAndUpdateAttendance(sessionId, studentId);

    if (student.userId) {
      await this.attendanceIntelligence.upsertParticipantSummary({
        sessionId,
        userId: student.userId,
        userType: 'student',
        participantId: studentId,
        userName: student.fullName,
        userEmail: student.email || student.zoomEmail,
      });
    }

    return attendance;
  }

  async recordLeave(
    sessionId: string,
    studentId: string,
    metadata?: { device?: string; clientType?: string; zoomUserId?: string; rawPayload?: any; webhookEventId?: string },
  ): Promise<SessionAttendance> {
    const session = await this.liveSessionRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const now = new Date();

    await this.attendanceIntelligence.appendTimelineEvent({
      sessionId,
      participantId: studentId,
      participantRole: 'student',
      zoomUserId: metadata?.zoomUserId,
      eventType: TimelineEventType.LEAVE,
      timestamp: now,
      device: metadata?.device,
      clientType: metadata?.clientType,
      rawPayload: metadata?.rawPayload,
      webhookEventId:
        metadata?.webhookEventId ||
        buildWebhookEventId('app_leave', sessionId, studentId, String(now.getTime())),
      source: TimelineEventSource.APP,
    });

    await this.attendanceIntelligence.closeOpenSegment(
      sessionId,
      student.email || student.zoomEmail || '',
      now,
    );

    const attendance = await this.attendanceIntelligence.calculateAndUpdateAttendance(sessionId, studentId);

    if (student.userId) {
      await this.attendanceIntelligence.upsertParticipantSummary({
        sessionId,
        userId: student.userId,
        userType: 'student',
        participantId: studentId,
        userName: student.fullName,
        userEmail: student.email || student.zoomEmail,
      });
    }

    return attendance;
  }

  /** 80%+ = Present, 50–79% = Late, <50% = Absent */
  calculateAttendanceStatus(attendedMinutes: number, scheduledMinutes: number): AttendanceStatus {
    if (scheduledMinutes <= 0) return AttendanceStatus.PRESENT;
    const ratio = attendedMinutes / scheduledMinutes;
    if (ratio >= 0.8) return AttendanceStatus.PRESENT;
    if (ratio >= 0.5) return AttendanceStatus.LATE;
    return AttendanceStatus.ABSENT;
  }

  private getScheduledDurationMinutes(session: LiveSession): number {
    if (!session.scheduledStart || !session.scheduledEnd) return 60;
    return Math.max(
      1,
      Math.round((session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / 60000),
    );
  }

  async markAbsent(sessionId: string, studentId: string): Promise<SessionAttendance> {
    let attendance = await this.attendanceRepository.findOne({
      where: { sessionId, studentId },
    });

    if (!attendance) {
      attendance = this.attendanceRepository.create({
        sessionId,
        studentId,
        attendanceStatus: AttendanceStatus.ABSENT,
      });
    } else if (!attendance.joinTime) {
      attendance.attendanceStatus = AttendanceStatus.ABSENT;
    }

    return this.attendanceRepository.save(attendance);
  }

  async getAttendanceForSession(sessionId: string): Promise<SessionAttendance[]> {
    return this.attendanceRepository.find({
      where: { sessionId },
      relations: ['student'],
      order: { joinTime: 'ASC' },
    });
  }

  async getAttendanceForStudent(
    studentId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: SessionAttendance[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const [data, total] = await this.attendanceRepository.findAndCount({
      where: { studentId },
      relations: ['session', 'session.teacher', 'session.schedule'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAttendanceStats(studentId: string): Promise<{
    total: number;
    present: number;
    late: number;
    absent: number;
    leftEarly: number;
    attendancePercentage: number;
  }> {
    const attendances = await this.attendanceRepository.find({
      where: { studentId },
    });

    const total = attendances.length;
    const present = attendances.filter(
      (a) => a.attendanceStatus === AttendanceStatus.PRESENT,
    ).length;
    const late = attendances.filter((a) => a.attendanceStatus === AttendanceStatus.LATE).length;
    const absent = attendances.filter((a) => a.attendanceStatus === AttendanceStatus.ABSENT).length;
    const leftEarly = attendances.filter(
      (a) => a.attendanceStatus === AttendanceStatus.LEFT_EARLY,
    ).length;
    const attendancePercentage = total > 0 ? ((present + late) / total) * 100 : 0;

    return { total, present, late, absent, leftEarly, attendancePercentage };
  }

  async bulkCreateAttendance(sessionId: string, studentIds: string[]): Promise<void> {
    const existing = await this.attendanceRepository.find({
      where: { sessionId },
    });
    const existingStudentIds = new Set(existing.map((a) => a.studentId));

    const newRecords = studentIds
      .filter((sid) => !existingStudentIds.has(sid))
      .map((studentId) =>
        this.attendanceRepository.create({
          sessionId,
          studentId,
          attendanceStatus: AttendanceStatus.ABSENT,
        }),
      );

    if (newRecords.length > 0) {
      await this.attendanceRepository.save(newRecords);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { ZoomService, ZoomReportParticipant } from './zoom.service';
import { AttendanceIntelligenceService } from './attendance-intelligence.service';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { SessionParticipantSummary } from './entities/session-participant-summary.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { ScheduleStudent } from '../schedules/entities/schedule-student.entity';
import {
  ParticipantTimelineEvent,
  TimelineEventSource,
  TimelineEventType,
} from './entities/participant-timeline-event.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { ReconciliationStatus } from './enums/reconciliation-status.enum';
import { buildWebhookEventId } from './webhook-event-id.util';

@Injectable()
export class AttendanceReconciliationService {
  private readonly logger = new Logger(AttendanceReconciliationService.name);
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(SessionParticipantSummary)
    private readonly summaryRepository: Repository<SessionParticipantSummary>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(ScheduleStudent)
    private readonly scheduleStudentRepository: Repository<ScheduleStudent>,
    @InjectRepository(ParticipantTimelineEvent)
    private readonly timelineRepository: Repository<ParticipantTimelineEvent>,
    private readonly zoomService: ZoomService,
    private readonly attendanceIntelligence: AttendanceIntelligenceService,
  ) {}

  scheduleReconciliation(sessionId: string, meetingUUID: string): void {
    this.liveSessionRepository
      .update(sessionId, {
        reconciliationStatus: ReconciliationStatus.PENDING,
      })
      .catch((err) => this.logger.error(`Failed to mark reconciliation pending for ${sessionId}`, err));

    setTimeout(() => {
      this.reconcileSessionFromReport(sessionId, meetingUUID).catch((error: Error) => {
        this.logger.error(
          `Reconciliation failed for session ${sessionId}: ${error.message}`,
          error.stack,
        );
      });
    }, 2 * 60 * 1000);
  }

  async processPendingReconciliations(): Promise<void> {
    const cutoff = new Date(Date.now() - 3 * 60 * 1000);
    const pending = await this.liveSessionRepository.find({
      where: {
        status: LiveSessionStatus.COMPLETED,
        reconciliationStatus: ReconciliationStatus.PENDING,
        completedAt: LessThanOrEqual(cutoff),
        reconciliationAttempts: LessThanOrEqual(this.MAX_ATTEMPTS - 1),
      },
      take: 20,
    });

    for (const session of pending) {
      if (!session.zoomMeetingUUID) {
        await this.liveSessionRepository.update(session.id, {
          reconciliationStatus: ReconciliationStatus.FAILED,
        });
        continue;
      }

      try {
        await this.reconcileSessionFromReport(session.id, session.zoomMeetingUUID);
      } catch (error) {
        this.logger.warn(
          `Retry reconciliation failed for session ${session.id}: ${(error as Error).message}`,
        );
      }
    }
  }

  async reconcileSessionFromReport(
    sessionId: string,
    meetingUUID: string,
  ): Promise<void> {
    const session = await this.liveSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['teacher'],
    });

    if (!session) {
      this.logger.warn(`Reconciliation skipped — session ${sessionId} not found`);
      return;
    }

    const uuid = meetingUUID || session.zoomMeetingUUID;
    if (!uuid) {
      this.logger.warn(`Reconciliation skipped — no meeting UUID for session ${sessionId}`);
      await this.liveSessionRepository.update(sessionId, {
        reconciliationStatus: ReconciliationStatus.FAILED,
      });
      return;
    }

    this.logger.log(`Starting attendance reconciliation for session ${sessionId}`);

    let participants: ZoomReportParticipant[];
    try {
      const accessToken = await this.zoomService.getTeacherAccessToken(session.teacherId);
      if (!accessToken) {
        this.logger.warn(
          `Reconciliation skipped for session ${sessionId}: teacher has no connected Zoom account`,
        );
        await this.liveSessionRepository.update(sessionId, {
          reconciliationStatus: ReconciliationStatus.FAILED,
        });
        return;
      }
      participants = await this.zoomService.getMeetingParticipantsReport(uuid, accessToken);
    } catch (error) {
      const message = (error as Error).message || '';
      if (this.isMissingReportScope(message)) {
        await this.liveSessionRepository.update(sessionId, {
          reconciliationStatus: ReconciliationStatus.DONE,
        });
        this.logger.warn(
          `Reconciliation skipped for session ${sessionId}: Zoom report scope not granted — using webhook/app timeline data only`,
        );
        return;
      }
      await this.incrementReconciliationAttempt(sessionId, message);
      throw error;
    }

    if (!participants.length) {
      await this.incrementReconciliationAttempt(sessionId, 'empty participant report');
      return;
    }

    await this.timelineRepository.delete({
      sessionId,
      source: TimelineEventSource.WEBHOOK,
    });

    const reportSegmentRows: Array<{
      userId: string;
      userEmail: string;
      userType: string;
      zoomParticipantId?: string;
      joinTime: Date | null;
      leaveTime: Date | null;
      durationSeconds: number;
    }> = [];

    for (const participant of participants) {
      const resolved = await this.resolveParticipant(session, participant);
      if (!resolved) continue;

      await this.insertReportTimelineEvents(session, participant, resolved);

      const joinTime = participant.join_time ? new Date(participant.join_time) : null;
      const leaveTime = participant.leave_time ? new Date(participant.leave_time) : null;
      reportSegmentRows.push({
        userId: resolved.userId,
        userEmail: participant.user_email || resolved.email,
        userType: resolved.role,
        zoomParticipantId: participant.user_id || participant.id,
        joinTime,
        leaveTime,
        durationSeconds: participant.duration || 0,
      });

      await this.attendanceIntelligence.upsertParticipantSummary({
        sessionId: session.id,
        userId: resolved.userId,
        userType: resolved.role,
        participantId: resolved.participantId,
        userName: participant.name || resolved.name,
        userEmail: participant.user_email || resolved.email,
        isReconciled: true,
      });
    }

    await this.attendanceIntelligence.rebuildReportSegments(sessionId, reportSegmentRows);
    await this.attendanceIntelligence.recalculateSession(sessionId);

    const attendances = await this.attendanceRepository.find({ where: { sessionId } });
    for (const attendance of attendances) {
      attendance.isReconciled = true;
    }
    await this.attendanceRepository.save(attendances);

    const summaries = await this.summaryRepository.find({ where: { sessionId } });
    for (const summary of summaries) {
      summary.isReconciled = true;
    }
    await this.summaryRepository.save(summaries);

    await this.liveSessionRepository.update(sessionId, {
      reconciliationStatus: ReconciliationStatus.DONE,
    });

    this.logger.log(
      `Reconciliation complete for session ${sessionId}: ${participants.length} report rows`,
    );
  }

  private isMissingReportScope(message: string): boolean {
    const lower = message.toLowerCase();
    return (
      lower.includes('report:read') ||
      lower.includes('list_meeting_participants') ||
      lower.includes('does not contain scopes')
    );
  }

  private async incrementReconciliationAttempt(sessionId: string, reason: string): Promise<void> {
    const session = await this.liveSessionRepository.findOne({ where: { id: sessionId } });
    if (!session) return;

    const attempts = (session.reconciliationAttempts || 0) + 1;
    await this.liveSessionRepository.update(sessionId, {
      reconciliationAttempts: attempts,
      reconciliationStatus:
        attempts >= this.MAX_ATTEMPTS
          ? ReconciliationStatus.FAILED
          : ReconciliationStatus.PENDING,
    });

    this.logger.warn(
      `Reconciliation attempt ${attempts}/${this.MAX_ATTEMPTS} for session ${sessionId}: ${reason}`,
    );
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private async getEnrolledStudentIds(session: LiveSession): Promise<string[]> {
    const ids = new Set<string>();
    if (session.studentId) ids.add(session.studentId);

    if (session.scheduleId) {
      const scheduleStudents = await this.scheduleStudentRepository.find({
        where: { scheduleId: session.scheduleId },
      });
      for (const ss of scheduleStudents) ids.add(ss.studentId);
    }

    return Array.from(ids);
  }

  private async insertReportTimelineEvents(
    session: LiveSession,
    participant: ZoomReportParticipant,
    resolved: {
      participantId: string;
      role: 'teacher' | 'student';
      userId: string;
      email: string;
      name: string;
    },
  ): Promise<void> {
    const joinTime = participant.join_time ? new Date(participant.join_time) : null;
    const leaveTime = participant.leave_time ? new Date(participant.leave_time) : null;

    if (joinTime) {
      await this.timelineRepository.save(
        this.timelineRepository.create({
          sessionId: session.id,
          participantId: resolved.participantId,
          participantRole: resolved.role,
          zoomUserId: participant.user_id || participant.id || null,
          eventType: TimelineEventType.JOIN,
          timestamp: joinTime,
          source: TimelineEventSource.REPORT,
          rawPayload: participant,
          webhookEventId: buildWebhookEventId('report_join', session.id, resolved.participantId),
        }),
      );
    }

    if (leaveTime) {
      await this.timelineRepository.save(
        this.timelineRepository.create({
          sessionId: session.id,
          participantId: resolved.participantId,
          participantRole: resolved.role,
          zoomUserId: participant.user_id || participant.id || null,
          eventType: TimelineEventType.LEAVE,
          timestamp: leaveTime,
          source: TimelineEventSource.REPORT,
          rawPayload: participant,
          webhookEventId: buildWebhookEventId('report_leave', session.id, resolved.participantId),
        }),
      );
    }
  }

  private async resolveParticipant(
    session: LiveSession,
    participant: ZoomReportParticipant,
  ): Promise<{
    participantId: string;
    role: 'teacher' | 'student';
    userId: string;
    email: string;
    name: string;
  } | null> {
    const email = participant.user_email?.trim().toLowerCase() || '';
    const name = participant.name || '';
    const participantName = this.normalizeName(name);

    if (email) {
      const student = await this.studentRepository.findOne({
        where: [{ email }, { zoomEmail: email }],
      });
      if (student?.userId) {
        return {
          participantId: student.id,
          role: 'student',
          userId: student.userId,
          email: student.email,
          name: student.fullName,
        };
      }

      const teacher = await this.teacherRepository.findOne({ where: { email } });
      if (teacher?.userId) {
        return {
          participantId: teacher.id,
          role: 'teacher',
          userId: teacher.userId,
          email: teacher.email,
          name: teacher.fullName,
        };
      }
    }

    if (session.teacher?.email && email === session.teacher.email.toLowerCase()) {
      return {
        participantId: session.teacherId,
        role: 'teacher',
        userId: session.teacher.userId,
        email: session.teacher.email,
        name: session.teacher.fullName,
      };
    }

    const enrolledIds = await this.getEnrolledStudentIds(session);
    if (enrolledIds.length > 0) {
      const enrolledStudents = await this.studentRepository.find({
        where: { id: In(enrolledIds) },
      });

      if (participantName) {
        const byName = enrolledStudents.find(
          (s) => this.normalizeName(s.fullName) === participantName,
        );
        if (byName?.userId) {
          return {
            participantId: byName.id,
            role: 'student',
            userId: byName.userId,
            email: byName.email,
            name: byName.fullName,
          };
        }
      }

      if (enrolledStudents.length === 1 && enrolledStudents[0].userId) {
        const only = enrolledStudents[0];
        return {
          participantId: only.id,
          role: 'student',
          userId: only.userId,
          email: only.email,
          name: only.fullName,
        };
      }
    }

    if (session.studentId) {
      const student = await this.studentRepository.findOne({ where: { id: session.studentId } });
      if (student?.userId) {
        return {
          participantId: student.id,
          role: 'student',
          userId: student.userId,
          email: student.email,
          name: student.fullName,
        };
      }
    }

    this.logger.debug(`Unresolved report participant: ${email || name}`);
    return null;
  }
}

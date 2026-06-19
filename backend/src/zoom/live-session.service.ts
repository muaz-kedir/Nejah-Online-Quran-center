import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { LiveSessionStatus } from './enums/live-session-status.enum';
import { AttendanceStatus } from './enums/live-session-status.enum';
import { SessionAttendance } from './entities/session-attendance.entity';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { QueryLiveSessionDto } from './dto/query-live-session.dto';
import { ZoomService } from './zoom.service';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { SessionAttendanceService } from './session-attendance.service';

@Injectable()
export class LiveSessionService {
  private readonly logger = new Logger(LiveSessionService.name);

  constructor(
    @InjectRepository(LiveSession)
    private readonly liveSessionRepository: Repository<LiveSession>,
    @InjectRepository(SessionAttendance)
    private readonly attendanceRepository: Repository<SessionAttendance>,
    @InjectRepository(ZoomIntegration)
    private readonly zoomIntegrationRepository: Repository<ZoomIntegration>,
    private readonly zoomService: ZoomService,
    private readonly notificationsService: NotificationsService,
    private readonly sessionAttendanceService: SessionAttendanceService,
  ) {}

  async create(dto: CreateLiveSessionDto): Promise<LiveSession> {
    const scheduledEnd = dto.scheduledEnd || new Date(dto.scheduledStart.getTime() + 60 * 60 * 1000);

    if (!dto.teacherId) {
      throw new BadRequestException('teacherId is required');
    }

    if (dto.scheduledStart >= scheduledEnd) {
      throw new BadRequestException('Scheduled start must be before scheduled end');
    }

    const session = this.liveSessionRepository.create({
      teacherId: dto.teacherId,
      studentId: dto.studentId,
      scheduleId: dto.scheduleId,
      scheduledStart: dto.scheduledStart,
      scheduledEnd,
      status: dto.status || LiveSessionStatus.SCHEDULED,
      notes: dto.notes,
      metadata: dto.metadata,
    });

    const saved = await this.liveSessionRepository.save(session);
    return this.findById(saved.id);
  }

  async createWithZoom(dto: CreateLiveSessionDto): Promise<LiveSession> {
    if (dto.studentId && dto.teacherId) {
      const existing = await this.liveSessionRepository.findOne({
        where: {
          studentId: dto.studentId,
          teacherId: dto.teacherId,
          status: In([LiveSessionStatus.SCHEDULED, LiveSessionStatus.LIVE]),
        },
      });
      if (existing) {
        throw new BadRequestException(
          `This student already has a ${existing.status.toLowerCase()} session. Complete or cancel the previous session before scheduling a new one.`,
        );
      }
    }

    const session = await this.create(dto);

    const integration = await this.zoomIntegrationRepository.findOne({
      where: { teacherId: dto.teacherId, connectionStatus: 'connected' },
    });

    if (!integration?.zoomUserId) {
      return this.findById(session.id);
    }

    const endTime = dto.scheduledEnd || new Date(dto.scheduledStart.getTime() + 60 * 60 * 1000);
    const durationMinutes = Math.round(
      (endTime.getTime() - dto.scheduledStart.getTime()) / 60000,
    );

    const meeting = await this.zoomService.createMeeting(
      await this.resolveTeacherZoomHost(integration),
      `Quran Class - ${dto.metadata?.className || 'Session'}`,
      dto.scheduledStart,
      durationMinutes,
    );

    session.zoomMeetingId = meeting.zoomMeetingId;
    session.zoomJoinUrl = meeting.zoomJoinUrl;
    session.zoomStartUrl = meeting.zoomStartUrl;
    session.zoomPassword = meeting.zoomPassword || null;
    await this.liveSessionRepository.save(session);

    const created = await this.findById(session.id);
    if (created.student?.userId) {
      try {
        await this.notificationsService.sendCustomNotifications(
          [created.student.userId],
          'New Class Scheduled',
          `Your class "${created.schedule?.className || 'Quran Class'}" has been scheduled for ${created.scheduledStart.toLocaleString()}. Join link: ${created.zoomJoinUrl}`,
          { sessionId: created.id, joinUrl: created.zoomJoinUrl, scheduledStart: created.scheduledStart.toISOString() },
        );
      } catch (err) {
        this.logger.error('Failed to send session scheduled notification', err);
      }
    }

    return created;
  }

  async findById(id: string): Promise<LiveSession> {
    const session = await this.liveSessionRepository.findOne({
      where: { id },
      relations: [
        'teacher',
        'student',
        'schedule',
        'schedule.scheduleStudents',
        'attendances',
        'attendances.student',
        'sessionNotes',
        'sessionNotes.teacher',
      ],
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    return session;
  }

  async findAll(query: QueryLiveSessionDto): Promise<{
    data: LiveSession[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      teacherId,
      studentId,
      status,
      page = 1,
      limit = 20,
      sortBy = 'scheduledStart',
      sortOrder = 'DESC',
      startDate,
      endDate,
    } = query;

    const where: FindOptionsWhere<LiveSession> = {};

    if (teacherId) where.teacherId = teacherId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    if (startDate && endDate) {
      where.scheduledStart = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.scheduledStart = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.scheduledStart = LessThanOrEqual(new Date(endDate));
    }

    const [data, total] = await this.liveSessionRepository.findAndCount({
      where,
      relations: ['teacher', 'student', 'attendances', 'attendances.student'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: string, dto: UpdateLiveSessionDto): Promise<LiveSession> {
    const session = await this.findById(id);

    const scheduledEnd = dto.scheduledEnd || session.scheduledEnd;
    if (dto.scheduledStart || dto.scheduledEnd) {
      const start = dto.scheduledStart || session.scheduledStart;
      if (start >= scheduledEnd) {
        throw new BadRequestException('Scheduled start must be before scheduled end');
      }
    }

    Object.assign(session, dto);
    await this.liveSessionRepository.save(session);
    return this.findById(id);
  }

  async cancel(id: string): Promise<LiveSession> {
    const session = await this.findById(id);

    if (session.status === LiveSessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed session');
    }

    session.status = LiveSessionStatus.CANCELLED;
    await this.liveSessionRepository.save(session);

    if (session.zoomMeetingId) {
      try {
        await this.zoomService.deleteMeeting(session.zoomMeetingId);
      } catch (error) {
        this.logger.warn(
          `Failed to delete Zoom meeting ${session.zoomMeetingId}: ${error.message}`,
        );
      }
    }

    const cancelled = await this.findById(id);
    if (cancelled.student?.userId) {
      try {
        await this.notificationsService.sendCustomNotifications(
          [cancelled.student.userId],
          'Class Cancelled',
          `Your class "${cancelled.schedule?.className || 'Quran Class'}" scheduled for ${cancelled.scheduledStart.toLocaleString()} has been cancelled.`,
          { sessionId: id },
        );
      } catch (err) {
        this.logger.error('Failed to send cancellation notification', err);
      }
    }

    return cancelled;
  }

  async start(teacherId: string, id: string): Promise<LiveSession> {
    const session = await this.findById(id);

    if (session.teacherId !== teacherId) {
      throw new BadRequestException('Only the assigned teacher can start this session');
    }

    if (session.status === LiveSessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot start a completed session');
    }

    if (session.status === LiveSessionStatus.CANCELLED) {
      throw new BadRequestException('Cannot start a cancelled session');
    }

    if (!session.zoomMeetingId) {
      await this.ensureZoomMeeting(session);
    }

    session.status = LiveSessionStatus.LIVE;
    session.actualStart = session.actualStart || new Date();
    session.teacherJoinTime = session.teacherJoinTime || new Date();

    await this.liveSessionRepository.save(session);

    const fullSession = await this.findById(id);
    const recipientUserIds = await this.getSessionStudentUserIds(fullSession);

    if (recipientUserIds.length > 0) {
      try {
        await this.notificationsService.sendCustomNotifications(
          recipientUserIds,
          `Class Started: ${fullSession.schedule?.className || 'Quran Class'}`,
          `Your class has started. Click to join.`,
          { sessionId: id, channel: 'MEETING_STARTED' },
        );
      } catch (err) {
        this.logger.error('Failed to send meeting started notifications', err);
      }
    }

    return fullSession;
  }

  async joinSession(
    sessionId: string,
    options: { studentId?: string; teacherId?: string; isTeacher?: boolean },
  ): Promise<LiveSession> {
    const session = await this.findById(sessionId);

    if (session.status !== LiveSessionStatus.LIVE && session.status !== LiveSessionStatus.SCHEDULED) {
      throw new BadRequestException('Session is not available to join');
    }

    if (options.isTeacher) {
      if (session.teacherId !== options.teacherId) {
        throw new ForbiddenException('You are not assigned to this session');
      }
      if (!session.zoomMeetingId) {
        await this.ensureZoomMeeting(session);
      }
      if (session.status === LiveSessionStatus.SCHEDULED) {
        session.status = LiveSessionStatus.LIVE;
        session.actualStart = session.actualStart || new Date();
      }
      session.teacherJoinTime = session.teacherJoinTime || new Date();
      await this.liveSessionRepository.save(session);
      return this.findById(sessionId);
    }

    if (!options.studentId) {
      throw new BadRequestException('Student ID required');
    }

    const allowed = await this.studentBelongsToSession(session, options.studentId);
    if (!allowed) {
      throw new ForbiddenException('You are not enrolled in this session');
    }

    if (session.status !== LiveSessionStatus.LIVE) {
      throw new BadRequestException('The teacher has not started this session yet');
    }

    await this.sessionAttendanceService.recordJoin(sessionId, options.studentId);
    return this.findById(sessionId);
  }

  async getClassroomAccess(
    sessionId: string,
    options: {
      studentId?: string;
      teacherId?: string;
      isTeacher?: boolean;
      userName: string;
      userEmail?: string;
    },
  ): Promise<{
    session: LiveSession;
    joinUrl: string | null;
    startUrl: string | null;
    sdkSignature: string | null;
    clientId: string | null;
    meetingNumber: string | null;
    password: string | null;
    role: 0 | 1;
    userName: string;
    userEmail: string;
    zak: string | null;
    sdkEnabled: boolean;
  }> {
    const session = await this.findById(sessionId);

    if (options.isTeacher) {
      if (session.teacherId !== options.teacherId) {
        throw new ForbiddenException('You are not assigned to this session');
      }
    } else if (options.studentId) {
      const allowed = await this.studentBelongsToSession(session, options.studentId);
      if (!allowed) {
        throw new ForbiddenException('You are not enrolled in this session');
      }
    } else {
      throw new ForbiddenException('Access denied');
    }

    const role: 0 | 1 = options.isTeacher ? 1 : 0;
    const meetingNumber = session.zoomMeetingId
      ? String(session.zoomMeetingId).replace(/\D/g, '')
      : null;
    const sdkConfigured = this.zoomService.isPlatformConfigured();

    let sdkSignature: string | null = null;
    if (meetingNumber && sdkConfigured) {
      sdkSignature = this.zoomService.generateMeetingSdkSignature(meetingNumber, role);
    }

    let zak: string | null = null;
    if (options.isTeacher && options.teacherId) {
      const integration = await this.zoomIntegrationRepository.findOne({
        where: { teacherId: options.teacherId, connectionStatus: 'connected' },
      });
      if (integration?.zoomUserId) {
        zak = await this.zoomService.getUserZakToken(integration.zoomUserId);
      }
    }

    return {
      session,
      joinUrl: session.zoomJoinUrl,
      startUrl: session.zoomStartUrl,
      sdkSignature,
      clientId: sdkConfigured ? this.zoomService.getOAuthClientId() : null,
      meetingNumber,
      password: session.zoomPassword || '',
      role,
      userName: options.userName,
      userEmail: options.userEmail || '',
      zak,
      sdkEnabled: !!(sdkConfigured && sdkSignature && meetingNumber),
    };
  }

  async getStudentActiveLiveSession(studentId: string): Promise<LiveSession | null> {
    const liveSessions = await this.liveSessionRepository.find({
      where: { status: LiveSessionStatus.LIVE },
      relations: ['teacher', 'student', 'schedule', 'schedule.scheduleStudents'],
      order: { actualStart: 'DESC' },
    });

    for (const session of liveSessions) {
      if (await this.studentBelongsToSession(session, studentId)) {
        return session;
      }
    }
    return null;
  }

  async getStudentUpcomingTodaySession(studentId: string): Promise<LiveSession | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await this.liveSessionRepository.find({
      where: {
        status: In([LiveSessionStatus.SCHEDULED, LiveSessionStatus.LIVE]),
        scheduledStart: Between(today, tomorrow),
      },
      relations: ['teacher', 'student', 'schedule', 'schedule.scheduleStudents'],
      order: { scheduledStart: 'ASC' },
    });

    for (const session of sessions) {
      if (await this.studentBelongsToSession(session, studentId)) {
        return session;
      }
    }
    return null;
  }

  async updateScheduledSessionsForSchedule(
    scheduleId: string,
    data: { startTimeString: string; endTimeString: string; className?: string },
  ): Promise<void> {
    const now = new Date();
    const sessions = await this.liveSessionRepository.find({
      where: {
        scheduleId,
        status: LiveSessionStatus.SCHEDULED,
        scheduledStart: MoreThanOrEqual(now),
      },
    });

    for (const session of sessions) {
      const date = new Date(session.scheduledStart);
      const [startHour, startMin] = data.startTimeString.split(':').map(Number);
      const [endHour, endMin] = data.endTimeString.split(':').map(Number);
      session.scheduledStart = new Date(date);
      session.scheduledStart.setHours(startHour, startMin, 0, 0);
      session.scheduledEnd = new Date(date);
      session.scheduledEnd.setHours(endHour, endMin, 0, 0);
      if (data.className) {
        session.metadata = { ...(session.metadata || {}), className: data.className };
      }
      await this.liveSessionRepository.save(session);
    }
  }

  async cancelFutureScheduledSessions(scheduleId: string): Promise<void> {
    const now = new Date();
    const sessions = await this.liveSessionRepository.find({
      where: {
        scheduleId,
        status: LiveSessionStatus.SCHEDULED,
        scheduledStart: MoreThanOrEqual(now),
      },
    });

    for (const session of sessions) {
      if (session.zoomMeetingId) {
        try {
          await this.zoomService.deleteMeeting(session.zoomMeetingId);
        } catch (error) {
          this.logger.warn(`Failed to delete Zoom meeting ${session.zoomMeetingId}: ${error.message}`);
        }
      }
      session.status = LiveSessionStatus.CANCELLED;
      await this.liveSessionRepository.save(session);
    }
  }

  private async resolveTeacherZoomHost(
    integration: ZoomIntegration,
    session?: LiveSession,
  ): Promise<string> {
    const resolved = await this.zoomService.resolveZoomUser(
      integration.zoomUserId,
      integration.zoomEmail || session?.teacher?.email || undefined,
    );

    if (
      resolved.id !== integration.zoomUserId ||
      (resolved.email && resolved.email !== integration.zoomEmail)
    ) {
      integration.zoomUserId = resolved.id;
      integration.zoomEmail = resolved.email || integration.zoomEmail;
      await this.zoomIntegrationRepository.save(integration);
    }

    return resolved.id;
  }

  private async ensureZoomMeeting(session: LiveSession): Promise<void> {
    const integration = await this.zoomIntegrationRepository.findOne({
      where: { teacherId: session.teacherId, connectionStatus: 'connected' },
    });

    if (!integration?.zoomUserId) {
      throw new BadRequestException(
        'Teacher Zoom account is not connected. Connect Zoom in settings before starting.',
      );
    }

    const durationMinutes = Math.round(
      (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / 60000,
    );

    const meeting = await this.zoomService.createMeeting(
      await this.resolveTeacherZoomHost(integration, session),
      `Quran Class - ${session.metadata?.className || session.schedule?.className || 'Session'}`,
      session.scheduledStart,
      durationMinutes || 60,
    );

    session.zoomMeetingId = meeting.zoomMeetingId;
    session.zoomJoinUrl = meeting.zoomJoinUrl;
    session.zoomStartUrl = meeting.zoomStartUrl;
    session.zoomPassword = meeting.zoomPassword || null;
    await this.liveSessionRepository.save(session);
  }

  private async studentBelongsToSession(session: LiveSession, studentId: string): Promise<boolean> {
    if (session.studentId === studentId) return true;
    if (session.schedule?.scheduleStudents?.some((ss) => ss.studentId === studentId)) return true;
    if (session.scheduleId && !session.schedule?.scheduleStudents) {
      const attendances = await this.attendanceRepository.find({
        where: { sessionId: session.id, studentId },
      });
      return attendances.length > 0;
    }
    return false;
  }

  private async getSessionStudentUserIds(session: LiveSession): Promise<string[]> {
    const userIds: string[] = [];
    if (session.student?.userId) userIds.push(session.student.userId);

    const attendances = session.attendances || [];
    for (const att of attendances) {
      if (att.student?.userId && !userIds.includes(att.student.userId)) {
        userIds.push(att.student.userId);
      }
    }
    return userIds;
  }

  async complete(id: string): Promise<LiveSession> {
    const session = await this.findById(id);

    if (session.status !== LiveSessionStatus.LIVE) {
      throw new BadRequestException('Only live sessions can be completed');
    }

    session.status = LiveSessionStatus.COMPLETED;
    session.actualEnd = new Date();
    session.teacherLeaveTime = session.teacherLeaveTime || new Date();

    if (session.actualStart) {
      const durationMs = session.actualEnd.getTime() - session.actualStart.getTime();
      session.durationMinutes = Math.floor(durationMs / 60000);
    }

    await this.liveSessionRepository.save(session);

    const attendances = await this.attendanceRepository.find({
      where: { sessionId: id },
      relations: ['session'],
    });

    const scheduledDuration = this.getScheduledDurationMinutes(session);

    for (const attendance of attendances) {
      if (!attendance.joinTime) {
        attendance.attendanceStatus = AttendanceStatus.ABSENT;
      } else {
        if (!attendance.leaveTime) {
          attendance.leaveTime = session.actualEnd;
        }
        attendance.duration = Math.floor(
          (attendance.leaveTime.getTime() - attendance.joinTime.getTime()) / 60000,
        );
        attendance.attendanceStatus = this.sessionAttendanceService.calculateAttendanceStatus(
          attendance.duration,
          scheduledDuration,
        );
      }
    }
    await this.attendanceRepository.save(attendances);

    try {
      const studentIds = attendances.map((a) => a.studentId);
      await this.notificationsService.sendCustomNotifications(
        studentIds,
        `Class Completed: ${session.schedule?.className || 'Quran Class'}`,
        `Your class has ended. Duration: ${session.durationMinutes} minutes.`,
        { sessionId: id, durationMinutes: session.durationMinutes },
      );
    } catch (err) {
      this.logger.error('Failed to send meeting ended notifications', err);
    }

    return this.findById(id);
  }

  async getUpcoming(teacherId?: string, studentId?: string): Promise<LiveSession[]> {
    const where: FindOptionsWhere<LiveSession> = {
      status: LiveSessionStatus.SCHEDULED,
      scheduledStart: MoreThanOrEqual(new Date()),
    };

    if (teacherId) where.teacherId = teacherId;
    if (studentId) where.studentId = studentId;

    return this.liveSessionRepository.find({
      where,
      relations: ['teacher', 'student', 'schedule'],
      order: { scheduledStart: 'ASC' },
      take: 20,
    });
  }

  async getTeacherSessions(
    teacherId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: LiveSession[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.findAll({
      teacherId,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    } as QueryLiveSessionDto);
  }

  async getStudentSessions(
    studentId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: LiveSession[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.findAll({
      studentId,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    } as QueryLiveSessionDto);
  }

  async updateZoomMeeting(
    scheduleId: string,
    startTime?: Date,
    endTime?: Date,
    className?: string,
  ): Promise<void> {
    const session = await this.liveSessionRepository.findOne({
      where: { scheduleId, status: LiveSessionStatus.SCHEDULED },
    });

    if (!session || !session.zoomMeetingId) return;

    try {
      await this.zoomService.updateMeeting(session.zoomMeetingId, {
        topic: className ? `Quran Class - ${className}` : undefined,
        startTime,
        durationMinutes:
          startTime && endTime
            ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
            : undefined,
      });

      if (startTime) session.scheduledStart = startTime;
      if (endTime) session.scheduledEnd = endTime;
      if (className) {
        session.metadata = { ...(session.metadata || {}), className };
      }
      await this.liveSessionRepository.save(session);
    } catch (error) {
      this.logger.warn(
        `Failed to update Zoom meeting for schedule ${scheduleId}: ${error.message}`,
      );
    }
  }

  async deleteZoomMeeting(scheduleId: string): Promise<void> {
    const session = await this.liveSessionRepository.findOne({
      where: { scheduleId },
    });

    if (!session || !session.zoomMeetingId) return;

    try {
      await this.zoomService.deleteMeeting(session.zoomMeetingId);
    } catch (error) {
      this.logger.warn(
        `Failed to delete Zoom meeting for schedule ${scheduleId}: ${error.message}`,
      );
    }

    await this.liveSessionRepository.delete(session.id);
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    return this.liveSessionRepository.find({
      where: { status: LiveSessionStatus.LIVE },
      relations: ['teacher', 'student', 'attendances', 'attendances.student'],
      order: { actualStart: 'DESC' },
    });
  }

  async getTodaysSessions(teacherId?: string): Promise<LiveSession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: FindOptionsWhere<LiveSession> = {
      scheduledStart: Between(today, tomorrow),
    };

    if (teacherId) where.teacherId = teacherId;

    return this.liveSessionRepository.find({
      where,
      relations: ['teacher', 'student', 'attendances', 'attendances.student'],
      order: { scheduledStart: 'ASC' },
    });
  }

  async getSessionStats(): Promise<{
    total: number;
    completed: number;
    cancelled: number;
    live: number;
    scheduled: number;
  }> {
    const total = await this.liveSessionRepository.count();
    const completed = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.COMPLETED },
    });
    const cancelled = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.CANCELLED },
    });
    const live = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.LIVE },
    });
    const scheduled = await this.liveSessionRepository.count({
      where: { status: LiveSessionStatus.SCHEDULED },
    });

    return { total, completed, cancelled, live, scheduled };
  }

  private getScheduledDurationMinutes(session: LiveSession): number {
    if (!session.scheduledStart || !session.scheduledEnd) return 60;
    return Math.max(
      1,
      Math.round((session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / 60000),
    );
  }
}

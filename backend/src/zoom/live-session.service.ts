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
import { LiveSessionAttendanceReportService } from './live-session-attendance-report.service';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import {
  getAppTimezone,
  startOfDayInZone,
  wallClockOnDateToUtc,
} from '../common/utils/app-timezone.util';
import {
  getLateStartGraceMs,
  isWithinLateStartWindow,
  normalizeScheduledEnd,
} from '../common/utils/session-window.util';
import { ScheduleSessionGeneratorService } from './schedule-session-generator.service';

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
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly zoomService: ZoomService,
    private readonly notificationsService: NotificationsService,
    private readonly sessionAttendanceService: SessionAttendanceService,
    private readonly attendanceReportService: LiveSessionAttendanceReportService,
    private readonly scheduleSessionGenerator: ScheduleSessionGeneratorService,
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
      joinWindowOpenMinutes: dto.metadata?.joinWindowOpenMinutes || 15,
      waitingRoomActive: true,
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

    if (!this.zoomService.isPlatformConfigured()) {
      return this.findById(session.id);
    }

    const endTime = dto.scheduledEnd || new Date(dto.scheduledStart.getTime() + 60 * 60 * 1000);
    const durationMinutes = Math.round(
      (endTime.getTime() - dto.scheduledStart.getTime()) / 60000,
    );

    const meeting = await this.zoomService.createMeetingForTeacher(
      `Quran Class - ${dto.metadata?.className || 'Session'}`,
      dto.scheduledStart,
      durationMinutes,
      dto.teacherId,
    );

    session.zoomMeetingId = meeting.meetingId;
    session.zoomMeetingUUID = meeting.meetingUUID;
    session.zoomJoinUrl = meeting.joinUrl;
    session.zoomStartUrl = meeting.startUrl;
    session.zoomPassword = meeting.password || null;
    await this.liveSessionRepository.save(session);

    const created = await this.findById(session.id);
    if (created.student?.userId) {
      try {
        const qiratManagers = await this.userRepository.find({
          where: { role: UserRole.QIRAT_MANAGER, isActive: true },
        });
        const recipients = [created.student.userId, ...qiratManagers.map((u) => u.id)];
        await this.notificationsService.sendCustomNotifications(
          recipients,
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
        'student.parent',
        'student.parent.user',
        'schedule',
        'schedule.scheduleStudents',
        'schedule.scheduleStudents.student',
        'schedule.scheduleStudents.student.parent',
        'schedule.scheduleStudents.student.parent.user',
        'attendances',
        'attendances.student',
        'attendances.student.parent',
        'attendances.student.parent.user',
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

  async cancel(id: string, cancellationReason?: string): Promise<LiveSession> {
    const session = await this.findById(id);

    if (session.status === LiveSessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed session');
    }

    if (session.status === LiveSessionStatus.CANCELLED) {
      throw new BadRequestException('Session is already cancelled');
    }

    if (session.status === LiveSessionStatus.NO_SHOW || session.status === LiveSessionStatus.EXPIRED) {
      throw new BadRequestException(`Cannot cancel a session with status: ${session.status}`);
    }

    session.status = LiveSessionStatus.CANCELLED;
    session.cancellationReason = cancellationReason || session.cancellationReason || null;
    await this.liveSessionRepository.save(session);

    if (session.zoomMeetingId) {
      try {
        const accessToken = await this.zoomService.getTeacherAccessToken(session.teacherId);
        if (accessToken) {
          await this.zoomService.deleteMeeting(session.zoomMeetingId, accessToken);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to delete Zoom meeting ${session.zoomMeetingId}: ${error.message}`,
        );
      }
    }

    const cancelled = await this.findById(id);
    if (cancelled.student?.userId) {
      try {
        const qiratManagers = await this.userRepository.find({
          where: { role: UserRole.QIRAT_MANAGER, isActive: true },
        });
        const recipients = [cancelled.student.userId, ...qiratManagers.map((u) => u.id)];
        await this.notificationsService.sendCustomNotifications(
          recipients,
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

  async startSession(
    sessionId: string,
    teacherId: string,
    meetingLink?: string,
  ): Promise<{
    zoomMeetingId: string | null;
    startUrl: string | null;
    joinUrl: string | null;
    zoomStartUrl: string | null;
    zoomJoinUrl: string | null;
    meetingLink: string | null;
    notificationSummary: {
      studentCount: number;
      parentCount: number;
      warnings: string[];
    };
  }> {
    const session = await this.start(teacherId, sessionId, meetingLink);

    let notificationSummary = { studentCount: 0, parentCount: 0, warnings: [] as string[] };
    try {
      const fullSession = await this.findById(sessionId);
      notificationSummary = await this.notificationsService.notifyLiveSessionStarted(fullSession);
    } catch (err) {
      this.logger.error('Failed to send session started notifications', err);
      notificationSummary.warnings.push('Notifications could not be sent');
    }

    return {
      zoomMeetingId: session.zoomMeetingId || null,
      startUrl: session.meetingLink || session.zoomStartUrl || null,
      joinUrl: session.meetingLink || session.zoomJoinUrl || null,
      zoomStartUrl: session.zoomStartUrl || null,
      zoomJoinUrl: session.zoomJoinUrl || null,
      meetingLink: session.meetingLink || null,
      notificationSummary,
    };
  }

  async start(teacherId: string, id: string, meetingLink?: string): Promise<LiveSession> {
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

    if (session.schedule) {
      const synced = await this.scheduleSessionGenerator.resyncSessionScheduleTimes(session);
      session.scheduledStart = synced.scheduledStart;
      session.scheduledEnd = synced.scheduledEnd;
    }

    const now = new Date();
    const graceMs = getLateStartGraceMs();

    if (
      session.status === LiveSessionStatus.NO_SHOW ||
      session.status === LiveSessionStatus.EXPIRED
    ) {
      if (!isWithinLateStartWindow(session.scheduledStart, session.scheduledEnd, now, graceMs)) {
        throw new BadRequestException(`Cannot start a session with status: ${session.status}`);
      }
      session.status = LiveSessionStatus.SCHEDULED;
      session.cancellationReason = null;
    }

    if (session.status !== LiveSessionStatus.LIVE) {
      const windowMs = (session.joinWindowOpenMinutes || 15) * 60 * 1000;
      const windowOpen = new Date(session.scheduledStart.getTime() - windowMs);

      if (now < windowOpen) {
        const diffMs = windowOpen.getTime() - now.getTime();
        const days = Math.floor(diffMs / 86400000);
        const hours = Math.floor((diffMs % 86400000) / 3600000);
        const minutes = Math.ceil((diffMs % 3600000) / 60000);
        let human: string;
        if (days > 0) {
          human = `${days} day(s) and ${hours} hour(s)`;
        } else if (hours > 0) {
          human = `${hours} hour(s) and ${minutes} minute(s)`;
        } else {
          human = `${minutes} minute(s)`;
        }
        throw new BadRequestException(
          `This session is scheduled for later. It can be started in approximately ${human}.`,
        );
      }

      if (!isWithinLateStartWindow(session.scheduledStart, session.scheduledEnd, now, graceMs)) {
        throw new BadRequestException(
          'This session has expired because its scheduled time window has passed. Create a new session or reschedule.',
        );
      }
    }

    const activeLiveCount = await this.liveSessionRepository.count({
      where: {
        teacherId,
        status: LiveSessionStatus.LIVE,
      },
    });

    if (activeLiveCount > 1 || (activeLiveCount === 1 && session.status !== LiveSessionStatus.LIVE)) {
      throw new BadRequestException(
        'You already have a live session in progress. End it before starting a new one.',
      );
    }

    if (session.status === LiveSessionStatus.LIVE) {
      return await this.findById(id);
    }

    if (meetingLink) {
      session.meetingLink = meetingLink;
    } else if (!session.zoomMeetingId) {
      await this.ensureZoomMeeting(session);
    }

    session.status = LiveSessionStatus.LIVE;
    session.actualStart = session.actualStart || new Date();
    session.teacherJoinTime = session.teacherJoinTime || new Date();

    await this.liveSessionRepository.save(session);

    this.logger.log(
      `Live session started — liveSessionId=${id}, teacherId=${teacherId}, ` +
        `studentId=${session.studentId || 'n/a'}, scheduleId=${session.scheduleId || 'n/a'}, ` +
        `meetingLink=${session.meetingLink ? 'provided' : 'n/a'}, ` +
        `zoomMeetingId=${session.zoomMeetingId || 'n/a'}, ` +
        `status=${session.status}, timestamp=${session.actualStart?.toISOString()}`,
    );

    try {
      await this.attendanceReportService.seedEnrollmentOnStart(id);
      const teacher = await this.teacherRepository.findOne({ where: { id: teacherId } });
      if (teacher?.userId) {
        await this.attendanceReportService.recordTeacherJoin(
          id,
          teacher,
          session.teacherJoinTime,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to seed attendance for session ${id}`, err);
    }

    const fullSession = await this.findById(id);

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
      const now = new Date();
      session.teacherJoinTime = session.teacherJoinTime || now;
      await this.liveSessionRepository.save(session);

      const teacher = await this.teacherRepository.findOne({ where: { id: options.teacherId } });
      if (teacher?.userId) {
        await this.attendanceReportService.recordTeacherJoin(sessionId, teacher, now);
      }

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

    const now = new Date();
    const windowMs = (session.joinWindowOpenMinutes || 15) * 60 * 1000;
    const windowOpen = new Date(session.scheduledStart.getTime() - windowMs);
    if (now < windowOpen) {
      const minutesUntilWindow = Math.ceil((windowOpen.getTime() - now.getTime()) / 60000);
      throw new BadRequestException(
        `The session join window opens in ${minutesUntilWindow} minute(s). You can join ${session.joinWindowOpenMinutes} minutes before the scheduled start.`,
      );
    }

    if (session.scheduledEnd && session.status !== LiveSessionStatus.LIVE) {
      const graceMs = getLateStartGraceMs();
      if (!isWithinLateStartWindow(session.scheduledStart, session.scheduledEnd, now, graceMs)) {
        throw new BadRequestException('This session has already ended');
      }
    }

    await this.sessionAttendanceService.recordJoin(sessionId, options.studentId);
    return this.findById(sessionId);
  }

  async leaveSession(
    sessionId: string,
    options: { studentId?: string; teacherId?: string; isTeacher?: boolean },
  ): Promise<LiveSession> {
    const session = await this.findById(sessionId);

    if (options.isTeacher) {
      if (session.teacherId !== options.teacherId) {
        throw new ForbiddenException('You are not assigned to this session');
      }
      return session;
    }

    if (!options.studentId) {
      throw new BadRequestException('Student ID required');
    }

    await this.sessionAttendanceService.recordLeave(sessionId, options.studentId);
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
    meetingLink: string | null;
    sdkSignature: string | null;
    clientId: string | null;
    meetingNumber: string | null;
    password: string | null;
    role: 0 | 1;
    userName: string;
    userEmail: string;
    zak: string | null;
    sdkEnabled: boolean;
    classroomStatus: 'waiting_for_teacher' | 'teacher_online' | 'waiting_for_students' | 'students_joining' | 'class_live' | 'class_ending' | 'completed' | 'cancelled' | 'expired' | 'no_show' | 'not_available';
    countdownSeconds: number | null;
    joinWindowOpenAt: Date | null;
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
    const sdkConfigured = this.zoomService.isSdkConfigured();

    let sdkSignature: string | null = null;
    if (meetingNumber && sdkConfigured) {
      sdkSignature = this.zoomService.generateMeetingSdkSignature(meetingNumber, role);
    }

    let zak: string | null = null;
    if (options.isTeacher && options.teacherId) {
      const integration = await this.zoomIntegrationRepository.findOne({
        where: { teacherId: options.teacherId, connectionStatus: 'connected' },
      });
      const zakTarget = integration?.zoomUserId || integration?.zoomEmail;
      if (zakTarget) {
        try {
          const accessToken = await this.zoomService.getTeacherAccessToken(options.teacherId);
          if (accessToken) {
            zak = await this.zoomService.getUserZakToken(zakTarget, accessToken);
          }
        } catch {
          // OAuth not configured — ZAK unavailable
        }
      }
    }

    const now = new Date();
    const windowMs = (session.joinWindowOpenMinutes || 15) * 60 * 1000;
    const joinWindowOpenAt = new Date(session.scheduledStart.getTime() - windowMs);
    const countdownSeconds = Math.max(0, Math.floor((session.scheduledStart.getTime() - now.getTime()) / 1000));

    let classroomStatus: string;
    switch (session.status) {
      case LiveSessionStatus.LIVE:
        if (options.isTeacher) {
          const studentAttendances = await this.attendanceRepository
            .createQueryBuilder('a')
            .where('a.sessionId = :sessionId', { sessionId })
            .andWhere('a.joinTime IS NOT NULL')
            .getCount();
          classroomStatus = studentAttendances > 0 ? 'class_live' : 'waiting_for_students';
        } else {
          classroomStatus = 'class_live';
        }
        break;
      case LiveSessionStatus.SCHEDULED:
        if (session.teacherJoinTime) {
          classroomStatus = 'teacher_online';
        } else if (countdownSeconds <= 0) {
          classroomStatus = 'waiting_for_teacher';
        } else if (now >= joinWindowOpenAt) {
          classroomStatus = 'waiting_for_teacher';
        } else {
          classroomStatus = 'not_available';
        }
        break;
      case LiveSessionStatus.COMPLETED:
        classroomStatus = 'completed';
        break;
      case LiveSessionStatus.CANCELLED:
        classroomStatus = 'cancelled';
        break;
      case LiveSessionStatus.NO_SHOW:
        classroomStatus = 'no_show';
        break;
      case LiveSessionStatus.EXPIRED:
        classroomStatus = 'expired';
        break;
      default:
        classroomStatus = 'not_available';
    }

    return {
      session,
      joinUrl: session.meetingLink || session.zoomJoinUrl,
      startUrl: session.meetingLink || session.zoomStartUrl,
      sdkSignature,
      clientId: sdkConfigured ? this.zoomService.getOAuthClientId() : null,
      meetingNumber,
      password: session.zoomPassword || '',
      role,
      userName: options.userName,
      userEmail: options.userEmail || '',
      zak,
      sdkEnabled: !!(sdkConfigured && sdkSignature && meetingNumber),
      classroomStatus: classroomStatus as any,
      countdownSeconds,
      joinWindowOpenAt,
      meetingLink: session.meetingLink || null,
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
    const today = startOfDayInZone(new Date(), getAppTimezone());
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
      const tz = getAppTimezone();
      const anchor = session.scheduledStart;
      session.scheduledStart = wallClockOnDateToUtc(anchor, data.startTimeString, tz);
      session.scheduledEnd = wallClockOnDateToUtc(anchor, data.endTimeString, tz);
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
          const accessToken = await this.zoomService.getTeacherAccessToken(session.teacherId);
          if (accessToken) {
            await this.zoomService.deleteMeeting(session.zoomMeetingId, accessToken);
          }
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
    const accessToken = await this.zoomService.requireTeacherAccessToken(integration.teacherId);
    const resolved = await this.zoomService.resolveZoomUser(
      integration.zoomUserId,
      integration.zoomEmail || session?.teacher?.email || undefined,
      accessToken,
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
    if (!session.teacherId) {
      throw new BadRequestException('Session has no assigned teacher — cannot create Zoom meeting');
    }

    const durationMinutes = Math.round(
      (session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / 60000,
    );

    const meeting = await this.zoomService.createMeetingForTeacher(
      `Quran Class - ${session.metadata?.className || session.schedule?.className || 'Session'}`,
      session.scheduledStart,
      durationMinutes || 60,
      session.teacherId,
    );

    session.zoomMeetingId = meeting.meetingId;
    session.zoomMeetingUUID = meeting.meetingUUID;
    session.zoomJoinUrl = meeting.joinUrl;
    session.zoomStartUrl = meeting.startUrl;
    session.zoomPassword = meeting.password || null;
    await this.liveSessionRepository.save(session);

    this.logger.log(
      `Zoom meeting provisioned — liveSessionId=${session.id}, zoomMeetingId=${session.zoomMeetingId}, ` +
        `zoomMeetingUUID=${session.zoomMeetingUUID || 'n/a'}, teacherId=${session.teacherId}`,
    );
  }

  private async registerStudentForMeeting(
    sessionId: string,
    studentId: string,
    meetingId: string,
    teacherId: string,
  ): Promise<void> {
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student?.email) return;

    const nameParts = (student.fullName || student.email).trim().split(/\s+/);
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || 'Student';

    try {
      const accessToken = await this.zoomService.requireTeacherAccessToken(teacherId);
      const joinUrl = await this.zoomService.registerParticipant(meetingId, {
        email: student.email,
        firstName,
        lastName,
      }, accessToken);

      let attendance = await this.attendanceRepository.findOne({
        where: { sessionId, studentId },
      });
      if (!attendance) {
        attendance = this.attendanceRepository.create({ sessionId, studentId });
      }
      attendance.zoomRegistrantJoinUrl = joinUrl;
      await this.attendanceRepository.save(attendance);
    } catch (error) {
      this.logger.warn(
        `Failed to register student ${studentId} for meeting ${meetingId}: ${error.message}`,
      );
    }
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

  async complete(id: string, completionReason?: string): Promise<LiveSession> {
    const session = await this.findById(id);

    if (session.status === LiveSessionStatus.COMPLETED) {
      throw new BadRequestException('Session is already completed');
    }

    if (session.status === LiveSessionStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled session');
    }

    if (session.status !== LiveSessionStatus.LIVE) {
      throw new BadRequestException('Only live sessions can be completed');
    }

    await this.attendanceReportService.finalizeSessionAttendance(id, new Date(), {
      completionReason,
    });

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
      const accessToken = await this.zoomService.getTeacherAccessToken(session.teacherId);
      if (!accessToken) return;

      await this.zoomService.updateMeeting(session.zoomMeetingId, {
        topic: className ? `Quran Class - ${className}` : undefined,
        startTime,
        durationMinutes:
          startTime && endTime
            ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
            : undefined,
      }, accessToken);

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
      const accessToken = await this.zoomService.getTeacherAccessToken(session.teacherId);
      if (accessToken) {
        await this.zoomService.deleteMeeting(session.zoomMeetingId, accessToken);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete Zoom meeting for schedule ${scheduleId}: ${error.message}`,
      );
    }
  }

  async markNoShow(id: string, reason?: string): Promise<LiveSession> {
    const session = await this.findById(id);

    if (session.status !== LiveSessionStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot mark session as no-show. Current status: ${session.status}`);
    }

    session.status = LiveSessionStatus.NO_SHOW;
    session.cancellationReason = reason || 'No participant joined the session';
    session.actualEnd = new Date();
    await this.liveSessionRepository.save(session);

    if (session.zoomMeetingId) {
      try {
        const accessToken = await this.zoomService.getTeacherAccessToken(session.teacherId);
        if (accessToken) {
          await this.zoomService.deleteMeeting(session.zoomMeetingId, accessToken);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete Zoom meeting for no-show session ${session.zoomMeetingId}: ${error.message}`);
      }
    }

    try {
      const studentUserIds = await this.resolveStudentUserIds(session);
      const qiratManagers = await this.userRepository.find({
        where: { role: UserRole.QIRAT_MANAGER, isActive: true },
      });
      const recipients = [...studentUserIds, ...qiratManagers.map((u) => u.id)];
      if (recipients.length > 0) {
        await this.notificationsService.sendCustomNotifications(
          recipients,
          'Session No-Show',
          `The session scheduled for ${session.scheduledStart.toLocaleString()} was marked as no-show because no participants joined.`,
          { sessionId: session.id, status: 'no_show' },
        );
      }
    } catch (err) {
      this.logger.error('Failed to send no-show notification', err);
    }

    return this.findById(id);
  }

  async markExpired(id: string): Promise<LiveSession> {
    const session = await this.findById(id);

    if (session.status !== LiveSessionStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot expire session. Current status: ${session.status}`);
    }

    session.status = LiveSessionStatus.EXPIRED;
    session.cancellationReason = 'Session expired because it was not started within its scheduled window';
    await this.liveSessionRepository.save(session);

    if (session.zoomMeetingId) {
      try {
        const accessToken = await this.zoomService.getTeacherAccessToken(session.teacherId);
        if (accessToken) {
          await this.zoomService.deleteMeeting(session.zoomMeetingId, accessToken);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete Zoom meeting for expired session ${session.zoomMeetingId}: ${error.message}`);
      }
    }

    try {
      const studentUserIds = await this.resolveStudentUserIds(session);
      const qiratManagers = await this.userRepository.find({
        where: { role: UserRole.QIRAT_MANAGER, isActive: true },
      });
      const recipients = [...studentUserIds, ...qiratManagers.map((u) => u.id)];
      if (recipients.length > 0) {
        await this.notificationsService.sendCustomNotifications(
          recipients,
          'Session Expired',
          `The session scheduled for ${session.scheduledStart.toLocaleString()} has expired because it was not started on time.`,
          { sessionId: session.id, status: 'expired' },
        );
      }
    } catch (err) {
      this.logger.error('Failed to send expired notification', err);
    }

    return this.findById(id);
  }

  async expireStaleSessions(): Promise<number> {
    const now = new Date();
    const graceMs = getLateStartGraceMs();
    const expireCutoff = new Date(now.getTime() - graceMs);

    const staleSessions = await this.liveSessionRepository.find({
      where: {
        status: LiveSessionStatus.SCHEDULED,
        scheduledEnd: LessThanOrEqual(expireCutoff),
      },
      relations: ['schedule'],
    });

    let expiredCount = 0;
    for (const session of staleSessions) {
      if (session.schedule) {
        await this.scheduleSessionGenerator.resyncSessionScheduleTimes(session);
      }
      const end = normalizeScheduledEnd(session.scheduledStart, session.scheduledEnd);
      if (now.getTime() > end.getTime() + graceMs) {
        session.status = LiveSessionStatus.EXPIRED;
        session.cancellationReason = 'Auto-expired: session window passed without activation';
        await this.liveSessionRepository.save(session);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.log(`Auto-expired ${expiredCount} stale session(s)`);
    }

    return expiredCount;
  }

  async getLiveSessions(): Promise<LiveSession[]> {
    return this.liveSessionRepository.find({
      where: { status: LiveSessionStatus.LIVE },
      relations: ['teacher', 'student', 'schedule', 'schedule.scheduleStudents', 'attendances', 'attendances.student'],
      order: { actualStart: 'DESC' },
    });
  }

  async getTodaysSessions(teacherId?: string): Promise<LiveSession[]> {
    const today = startOfDayInZone(new Date(), getAppTimezone());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: FindOptionsWhere<LiveSession> = {
      scheduledStart: Between(today, tomorrow),
    };

    if (teacherId) where.teacherId = teacherId;

    return this.liveSessionRepository.find({
      where,
      relations: [
        'teacher',
        'student',
        'schedule',
        'schedule.scheduleStudents',
        'schedule.scheduleStudents.student',
        'attendances',
        'attendances.student',
      ],
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

  async getStudentAttendanceHistory(
    studentId: string,
    options: {
      page?: number;
      limit?: number;
      from?: string;
      to?: string;
      status?: string;
    } = {},
  ): Promise<{
    data: Array<{
      id: string;
      sessionId: string;
      classTitle: string;
      teacherName: string;
      sessionDate: string;
      scheduledStart: string;
      scheduledEnd: string;
      joinTime: string | null;
      leaveTime: string | null;
      duration: number | null;
      attendanceStatus: string;
      status: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      total: number;
      present: number;
      late: number;
      absent: number;
      leftEarly: number;
      partial: number;
      excused: number;
    };
  }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const query = this.attendanceRepository
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.session', 'session')
      .innerJoinAndSelect('session.teacher', 'teacher')
      .leftJoinAndSelect('session.schedule', 'schedule')
      .where('a.studentId = :studentId', { studentId });

    if (options.from) {
      query.andWhere('session.scheduledStart >= :from', { from: options.from });
    }
    if (options.to) {
      query.andWhere('session.scheduledStart <= :to', { to: options.to });
    }
    if (options.status) {
      query.andWhere('a.attendanceStatus = :status', { status: options.status.toUpperCase() });
    }

    const total = await query.getCount();

    // Get summary stats (unpaginated)
    const summaryQuery = this.attendanceRepository
      .createQueryBuilder('a')
      .innerJoin('a.session', 'session')
      .where('a.studentId = :studentId', { studentId });
    if (options.from) summaryQuery.andWhere('session.scheduledStart >= :from', { from: options.from });
    if (options.to) summaryQuery.andWhere('session.scheduledStart <= :to', { to: options.to });
    const allRecords = await summaryQuery.select(['a.attendanceStatus']).getRawMany();

    const summary = {
      total: allRecords.length,
      present: 0,
      late: 0,
      absent: 0,
      leftEarly: 0,
      partial: 0,
      excused: 0,
    };
    for (const r of allRecords) {
      const s = r.a_attendanceStatus;
      if (s === 'PRESENT') summary.present++;
      else if (s === 'LATE') summary.late++;
      else if (s === 'ABSENT') summary.absent++;
      else if (s === 'LEFT_EARLY') summary.leftEarly++;
      else if (s === 'PARTIAL') summary.partial++;
      else if (s === 'EXCUSED') summary.excused++;
    }

    const records = await query
      .orderBy('session.scheduledStart', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const data = records.map((a) => ({
      id: a.id,
      sessionId: a.sessionId,
      classTitle:
        a.session.metadata?.className ||
        a.session.schedule?.className ||
        'Quran Class',
      teacherName: a.session.teacher?.fullName || '—',
      sessionDate: a.session.scheduledStart
        ? a.session.scheduledStart.toISOString().split('T')[0]
        : '—',
      scheduledStart: a.session.scheduledStart?.toISOString() || null,
      scheduledEnd: a.session.scheduledEnd?.toISOString() || null,
      joinTime: a.joinTime?.toISOString() || null,
      leaveTime: a.leaveTime?.toISOString() || null,
      duration: a.duration || null,
      attendanceStatus: a.attendanceStatus,
      status: a.session.status,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  async getSessionAttendanceDetail(
    sessionId: string,
  ): Promise<{
    session: {
      id: string;
      classTitle: string;
      teacherName: string;
      sessionDate: string;
      scheduledStart: string | null;
      scheduledEnd: string | null;
      actualStart: string | null;
      actualEnd: string | null;
      durationMinutes: number | null;
      status: string;
    };
    students: Array<{
      id: string;
      studentId: string;
      studentName: string;
      joinTime: string | null;
      leaveTime: string | null;
      duration: number | null;
      attendanceStatus: string;
    }>;
    summary: {
      total: number;
      present: number;
      late: number;
      absent: number;
      leftEarly: number;
      partial: number;
      excused: number;
      attendancePercentage: number;
    };
  }> {
    const session = await this.liveSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['teacher', 'schedule'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const attendances = await this.attendanceRepository.find({
      where: { sessionId },
      relations: ['student'],
      order: { joinTime: 'ASC' },
    });

    const summary = {
      total: attendances.length,
      present: 0,
      late: 0,
      absent: 0,
      leftEarly: 0,
      partial: 0,
      excused: 0,
      attendancePercentage: 0,
    };

    const students = attendances.map((a) => {
      if (a.attendanceStatus === 'PRESENT') summary.present++;
      else if (a.attendanceStatus === 'LATE') summary.late++;
      else if (a.attendanceStatus === 'ABSENT') summary.absent++;
      else if (a.attendanceStatus === 'LEFT_EARLY') summary.leftEarly++;
      else if (a.attendanceStatus === 'PARTIAL') summary.partial++;
      else if (a.attendanceStatus === 'EXCUSED') summary.excused++;

      return {
        id: a.id,
        studentId: a.studentId,
        studentName: a.student?.fullName || 'Unknown',
        joinTime: a.joinTime?.toISOString() || null,
        leaveTime: a.leaveTime?.toISOString() || null,
        duration: a.duration || null,
        attendanceStatus: a.attendanceStatus,
      };
    });

    const accounted = summary.present + summary.late;
    summary.attendancePercentage = summary.total > 0
      ? Math.round((accounted / summary.total) * 100)
      : 0;

    return {
      session: {
        id: session.id,
        classTitle: session.metadata?.className || session.schedule?.className || 'Quran Class',
        teacherName: session.teacher?.fullName || '—',
        sessionDate: session.scheduledStart
          ? session.scheduledStart.toISOString().split('T')[0]
          : '—',
        scheduledStart: session.scheduledStart?.toISOString() || null,
        scheduledEnd: session.scheduledEnd?.toISOString() || null,
        actualStart: session.actualStart?.toISOString() || null,
        actualEnd: session.actualEnd?.toISOString() || null,
        durationMinutes: session.durationMinutes || null,
        status: session.status,
      },
      students,
      summary,
    };
  }

  async getAdminAttendanceOverview(
    options: {
      teacherId?: string;
      studentId?: string;
      from?: string;
      to?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: Array<{
      id: string;
      sessionId: string;
      studentName: string;
      teacherName: string;
      classTitle: string;
      sessionDate: string;
      joinTime: string | null;
      leaveTime: string | null;
      duration: number | null;
      attendanceStatus: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      totalSessions: number;
      totalAttendances: number;
      present: number;
      late: number;
      absent: number;
      overallPercentage: number;
    };
  }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const query = this.attendanceRepository
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.session', 'session')
      .innerJoinAndSelect('session.teacher', 'teacher')
      .leftJoinAndSelect('a.student', 'student')
      .leftJoinAndSelect('session.schedule', 'schedule');

    if (options.teacherId) {
      query.andWhere('session.teacherId = :teacherId', { teacherId: options.teacherId });
    }
    if (options.studentId) {
      query.andWhere('a.studentId = :studentId', { studentId: options.studentId });
    }
    if (options.from) {
      query.andWhere('session.scheduledStart >= :from', { from: options.from });
    }
    if (options.to) {
      query.andWhere('session.scheduledStart <= :to', { to: options.to });
    }
    if (options.status) {
      query.andWhere('a.attendanceStatus = :status', { status: options.status.toUpperCase() });
    }

    const total = await query.getCount();

    // summary stats (unpaginated)
    const sumQuery = this.attendanceRepository
      .createQueryBuilder('a')
      .innerJoin('a.session', 'session');
    if (options.teacherId) sumQuery.andWhere('session.teacherId = :teacherId', { teacherId: options.teacherId });
    if (options.studentId) sumQuery.andWhere('a.studentId = :studentId', { studentId: options.studentId });
    if (options.from) sumQuery.andWhere('session.scheduledStart >= :from', { from: options.from });
    if (options.to) sumQuery.andWhere('session.scheduledStart <= :to', { to: options.to });
    const allStatuses = await sumQuery.select(['a.attendanceStatus']).getRawMany();

    const present = allStatuses.filter((r) => r.a_attendanceStatus === 'PRESENT' || r.a_attendanceStatus === 'LATE').length;
    const summary = {
      totalSessions: 0,
      totalAttendances: allStatuses.length,
      present: allStatuses.filter((r) => r.a_attendanceStatus === 'PRESENT').length,
      late: allStatuses.filter((r) => r.a_attendanceStatus === 'LATE').length,
      absent: allStatuses.filter((r) => r.a_attendanceStatus === 'ABSENT').length,
      overallPercentage: allStatuses.length > 0
        ? Math.round((present / allStatuses.length) * 100)
        : 0,
    };

    const records = await query
      .orderBy('session.scheduledStart', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const data = records.map((a) => ({
      id: a.id,
      sessionId: a.sessionId,
      studentName: a.student?.fullName || 'Unknown',
      teacherName: a.session.teacher?.fullName || '—',
      classTitle:
        a.session.metadata?.className ||
        a.session.schedule?.className ||
        'Quran Class',
      sessionDate: a.session.scheduledStart
        ? a.session.scheduledStart.toISOString().split('T')[0]
        : '—',
      joinTime: a.joinTime?.toISOString() || null,
      leaveTime: a.leaveTime?.toISOString() || null,
      duration: a.duration || null,
      attendanceStatus: a.attendanceStatus,
    }));

    summary.totalSessions = new Set(data.map((d) => d.sessionId)).size;

    return { data, total, page, limit, totalPages: Math.ceil(total / limit), summary };
  }

  private async resolveStudentUserIds(session: LiveSession): Promise<string[]> {
    if (!session.studentId) return [];
    const student = await this.studentRepository.findOne({
      where: { id: session.studentId },
    });
    if (student?.userId) return [student.userId];
    return [];
  }

  private getScheduledDurationMinutes(session: LiveSession): number {
    if (!session.scheduledStart || !session.scheduledEnd) return 60;
    return Math.max(
      1,
      Math.round((session.scheduledEnd.getTime() - session.scheduledStart.getTime()) / 60000),
    );
  }
}

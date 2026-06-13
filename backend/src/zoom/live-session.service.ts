import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
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
  ) {}

  async create(dto: CreateLiveSessionDto): Promise<LiveSession> {
    if (dto.scheduledStart >= dto.scheduledEnd) {
      throw new BadRequestException('Scheduled start must be before scheduled end');
    }

    const session = this.liveSessionRepository.create({
      teacherId: dto.teacherId,
      studentId: dto.studentId,
      scheduleId: dto.scheduleId,
      scheduledStart: dto.scheduledStart,
      scheduledEnd: dto.scheduledEnd,
      status: dto.status || LiveSessionStatus.SCHEDULED,
      notes: dto.notes,
      metadata: dto.metadata,
    });

    const saved = await this.liveSessionRepository.save(session);
    return this.findById(saved.id);
  }

  async createWithZoom(dto: CreateLiveSessionDto): Promise<LiveSession> {
    const session = await this.create(dto);

    const integration = await this.zoomIntegrationRepository.findOne({
      where: { teacherId: dto.teacherId, connectionStatus: 'connected' },
    });

    if (!integration?.zoomUserId) {
      return this.findById(session.id);
    }

    const durationMinutes = Math.round(
      (dto.scheduledEnd.getTime() - dto.scheduledStart.getTime()) / 60000,
    );

    const meeting = await this.zoomService.createMeeting(
      integration.zoomUserId,
      `Quran Class - ${dto.metadata?.className || 'Session'}`,
      dto.scheduledStart,
      durationMinutes,
    );

    session.zoomMeetingId = meeting.zoomMeetingId;
    session.zoomJoinUrl = meeting.zoomJoinUrl;
    session.zoomStartUrl = meeting.zoomStartUrl;
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

    if (dto.scheduledStart || dto.scheduledEnd) {
      const start = dto.scheduledStart || session.scheduledStart;
      const end = dto.scheduledEnd || session.scheduledEnd;
      if (start >= end) {
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

    session.status = LiveSessionStatus.LIVE;
    session.actualStart = new Date();

    await this.liveSessionRepository.save(session);

    const fullSession = await this.findById(id);
    const studentIds = fullSession.attendances?.map((a) => a.studentId) || [];

    try {
      await this.notificationsService.sendCustomNotifications(
        studentIds,
        `Class Started: ${fullSession.schedule?.className || 'Quran Class'}`,
        `Your class has started. Click to join.`,
        { sessionId: id, meetingLink: session.zoomJoinUrl },
      );
    } catch (err) {
      this.logger.error('Failed to send meeting started notifications', err);
    }

    return fullSession;
  }

  async complete(id: string): Promise<LiveSession> {
    const session = await this.findById(id);

    if (session.status !== LiveSessionStatus.LIVE) {
      throw new BadRequestException('Only live sessions can be completed');
    }

    session.status = LiveSessionStatus.COMPLETED;
    session.actualEnd = new Date();

    if (session.actualStart) {
      const durationMs = session.actualEnd.getTime() - session.actualStart.getTime();
      session.durationMinutes = Math.floor(durationMs / 60000);
    }

    await this.liveSessionRepository.save(session);

    const attendances = await this.attendanceRepository.find({
      where: { sessionId: id },
    });

    for (const attendance of attendances) {
      if (!attendance.joinTime) {
        attendance.attendanceStatus = AttendanceStatus.ABSENT;
      } else if (!attendance.leaveTime) {
        attendance.leaveTime = session.actualEnd;
        if (attendance.joinTime) {
          attendance.duration = Math.floor(
            (attendance.leaveTime.getTime() - attendance.joinTime.getTime()) / 60000,
          );
        }
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
    page = 1,
    limit = 20,
  ): Promise<{
    data: LiveSession[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.findAll({ teacherId, page, limit } as QueryLiveSessionDto);
  }

  async getStudentSessions(
    studentId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    data: LiveSession[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    return this.findAll({ studentId, page, limit } as QueryLiveSessionDto);
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
}

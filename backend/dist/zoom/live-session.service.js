"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LiveSessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveSessionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const live_session_entity_1 = require("./entities/live-session.entity");
const live_session_status_enum_1 = require("./enums/live-session-status.enum");
const live_session_status_enum_2 = require("./enums/live-session-status.enum");
const session_attendance_entity_1 = require("./entities/session-attendance.entity");
const zoom_service_1 = require("./zoom.service");
const zoom_integration_entity_1 = require("./entities/zoom-integration.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let LiveSessionService = LiveSessionService_1 = class LiveSessionService {
    constructor(liveSessionRepository, attendanceRepository, zoomIntegrationRepository, zoomService, notificationsService) {
        this.liveSessionRepository = liveSessionRepository;
        this.attendanceRepository = attendanceRepository;
        this.zoomIntegrationRepository = zoomIntegrationRepository;
        this.zoomService = zoomService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(LiveSessionService_1.name);
    }
    async create(dto) {
        if (dto.scheduledStart >= dto.scheduledEnd) {
            throw new common_1.BadRequestException('Scheduled start must be before scheduled end');
        }
        const session = this.liveSessionRepository.create({
            teacherId: dto.teacherId,
            studentId: dto.studentId,
            scheduleId: dto.scheduleId,
            scheduledStart: dto.scheduledStart,
            scheduledEnd: dto.scheduledEnd,
            status: dto.status || live_session_status_enum_1.LiveSessionStatus.SCHEDULED,
            notes: dto.notes,
            metadata: dto.metadata,
        });
        const saved = await this.liveSessionRepository.save(session);
        return this.findById(saved.id);
    }
    async createWithZoom(dto) {
        const session = await this.create(dto);
        const integration = await this.zoomIntegrationRepository.findOne({
            where: { teacherId: dto.teacherId, connectionStatus: 'connected' },
        });
        if (!integration?.zoomUserId) {
            return this.findById(session.id);
        }
        const durationMinutes = Math.round((dto.scheduledEnd.getTime() - dto.scheduledStart.getTime()) / 60000);
        const meeting = await this.zoomService.createMeeting(integration.zoomUserId, `Quran Class - ${dto.metadata?.className || 'Session'}`, dto.scheduledStart, durationMinutes);
        session.zoomMeetingId = meeting.zoomMeetingId;
        session.zoomJoinUrl = meeting.zoomJoinUrl;
        session.zoomStartUrl = meeting.zoomStartUrl;
        await this.liveSessionRepository.save(session);
        const created = await this.findById(session.id);
        if (created.student?.userId) {
            try {
                await this.notificationsService.sendCustomNotifications([created.student.userId], 'New Class Scheduled', `Your class "${created.schedule?.className || 'Quran Class'}" has been scheduled for ${created.scheduledStart.toLocaleString()}. Join link: ${created.zoomJoinUrl}`, { sessionId: created.id, joinUrl: created.zoomJoinUrl, scheduledStart: created.scheduledStart.toISOString() });
            }
            catch (err) {
                this.logger.error('Failed to send session scheduled notification', err);
            }
        }
        return created;
    }
    async findById(id) {
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
            throw new common_1.NotFoundException('Live session not found');
        }
        return session;
    }
    async findAll(query) {
        const { teacherId, studentId, status, page = 1, limit = 20, sortBy = 'scheduledStart', sortOrder = 'DESC', startDate, endDate, } = query;
        const where = {};
        if (teacherId)
            where.teacherId = teacherId;
        if (studentId)
            where.studentId = studentId;
        if (status)
            where.status = status;
        if (startDate && endDate) {
            where.scheduledStart = (0, typeorm_2.Between)(new Date(startDate), new Date(endDate));
        }
        else if (startDate) {
            where.scheduledStart = (0, typeorm_2.MoreThanOrEqual)(new Date(startDate));
        }
        else if (endDate) {
            where.scheduledStart = (0, typeorm_2.LessThanOrEqual)(new Date(endDate));
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
    async update(id, dto) {
        const session = await this.findById(id);
        if (dto.scheduledStart || dto.scheduledEnd) {
            const start = dto.scheduledStart || session.scheduledStart;
            const end = dto.scheduledEnd || session.scheduledEnd;
            if (start >= end) {
                throw new common_1.BadRequestException('Scheduled start must be before scheduled end');
            }
        }
        Object.assign(session, dto);
        await this.liveSessionRepository.save(session);
        return this.findById(id);
    }
    async cancel(id) {
        const session = await this.findById(id);
        if (session.status === live_session_status_enum_1.LiveSessionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel a completed session');
        }
        session.status = live_session_status_enum_1.LiveSessionStatus.CANCELLED;
        await this.liveSessionRepository.save(session);
        if (session.zoomMeetingId) {
            try {
                await this.zoomService.deleteMeeting(session.zoomMeetingId);
            }
            catch (error) {
                this.logger.warn(`Failed to delete Zoom meeting ${session.zoomMeetingId}: ${error.message}`);
            }
        }
        const cancelled = await this.findById(id);
        if (cancelled.student?.userId) {
            try {
                await this.notificationsService.sendCustomNotifications([cancelled.student.userId], 'Class Cancelled', `Your class "${cancelled.schedule?.className || 'Quran Class'}" scheduled for ${cancelled.scheduledStart.toLocaleString()} has been cancelled.`, { sessionId: id });
            }
            catch (err) {
                this.logger.error('Failed to send cancellation notification', err);
            }
        }
        return cancelled;
    }
    async start(teacherId, id) {
        const session = await this.findById(id);
        if (session.teacherId !== teacherId) {
            throw new common_1.BadRequestException('Only the assigned teacher can start this session');
        }
        if (session.status === live_session_status_enum_1.LiveSessionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot start a completed session');
        }
        if (session.status === live_session_status_enum_1.LiveSessionStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot start a cancelled session');
        }
        session.status = live_session_status_enum_1.LiveSessionStatus.LIVE;
        session.actualStart = new Date();
        await this.liveSessionRepository.save(session);
        const fullSession = await this.findById(id);
        const studentIds = fullSession.attendances?.map((a) => a.studentId) || [];
        try {
            await this.notificationsService.sendCustomNotifications(studentIds, `Class Started: ${fullSession.schedule?.className || 'Quran Class'}`, `Your class has started. Click to join.`, { sessionId: id, meetingLink: session.zoomJoinUrl });
        }
        catch (err) {
            this.logger.error('Failed to send meeting started notifications', err);
        }
        return fullSession;
    }
    async complete(id) {
        const session = await this.findById(id);
        if (session.status !== live_session_status_enum_1.LiveSessionStatus.LIVE) {
            throw new common_1.BadRequestException('Only live sessions can be completed');
        }
        session.status = live_session_status_enum_1.LiveSessionStatus.COMPLETED;
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
                attendance.attendanceStatus = live_session_status_enum_2.AttendanceStatus.ABSENT;
            }
            else if (!attendance.leaveTime) {
                attendance.leaveTime = session.actualEnd;
                if (attendance.joinTime) {
                    attendance.duration = Math.floor((attendance.leaveTime.getTime() - attendance.joinTime.getTime()) / 60000);
                }
            }
        }
        await this.attendanceRepository.save(attendances);
        try {
            const studentIds = attendances.map((a) => a.studentId);
            await this.notificationsService.sendCustomNotifications(studentIds, `Class Completed: ${session.schedule?.className || 'Quran Class'}`, `Your class has ended. Duration: ${session.durationMinutes} minutes.`, { sessionId: id, durationMinutes: session.durationMinutes });
        }
        catch (err) {
            this.logger.error('Failed to send meeting ended notifications', err);
        }
        return this.findById(id);
    }
    async getUpcoming(teacherId, studentId) {
        const where = {
            status: live_session_status_enum_1.LiveSessionStatus.SCHEDULED,
            scheduledStart: (0, typeorm_2.MoreThanOrEqual)(new Date()),
        };
        if (teacherId)
            where.teacherId = teacherId;
        if (studentId)
            where.studentId = studentId;
        return this.liveSessionRepository.find({
            where,
            relations: ['teacher', 'student', 'schedule'],
            order: { scheduledStart: 'ASC' },
            take: 20,
        });
    }
    async getTeacherSessions(teacherId, page = 1, limit = 20) {
        return this.findAll({ teacherId, page, limit });
    }
    async getStudentSessions(studentId, page = 1, limit = 20) {
        return this.findAll({ studentId, page, limit });
    }
    async updateZoomMeeting(scheduleId, startTime, endTime, className) {
        const session = await this.liveSessionRepository.findOne({
            where: { scheduleId, status: live_session_status_enum_1.LiveSessionStatus.SCHEDULED },
        });
        if (!session || !session.zoomMeetingId)
            return;
        try {
            await this.zoomService.updateMeeting(session.zoomMeetingId, {
                topic: className ? `Quran Class - ${className}` : undefined,
                startTime,
                durationMinutes: startTime && endTime
                    ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
                    : undefined,
            });
            if (startTime)
                session.scheduledStart = startTime;
            if (endTime)
                session.scheduledEnd = endTime;
            if (className) {
                session.metadata = { ...(session.metadata || {}), className };
            }
            await this.liveSessionRepository.save(session);
        }
        catch (error) {
            this.logger.warn(`Failed to update Zoom meeting for schedule ${scheduleId}: ${error.message}`);
        }
    }
    async deleteZoomMeeting(scheduleId) {
        const session = await this.liveSessionRepository.findOne({
            where: { scheduleId },
        });
        if (!session || !session.zoomMeetingId)
            return;
        try {
            await this.zoomService.deleteMeeting(session.zoomMeetingId);
        }
        catch (error) {
            this.logger.warn(`Failed to delete Zoom meeting for schedule ${scheduleId}: ${error.message}`);
        }
        await this.liveSessionRepository.delete(session.id);
    }
    async getLiveSessions() {
        return this.liveSessionRepository.find({
            where: { status: live_session_status_enum_1.LiveSessionStatus.LIVE },
            relations: ['teacher', 'student', 'attendances', 'attendances.student'],
            order: { actualStart: 'DESC' },
        });
    }
    async getTodaysSessions(teacherId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const where = {
            scheduledStart: (0, typeorm_2.Between)(today, tomorrow),
        };
        if (teacherId)
            where.teacherId = teacherId;
        return this.liveSessionRepository.find({
            where,
            relations: ['teacher', 'student', 'attendances', 'attendances.student'],
            order: { scheduledStart: 'ASC' },
        });
    }
    async getSessionStats() {
        const total = await this.liveSessionRepository.count();
        const completed = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.COMPLETED },
        });
        const cancelled = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.CANCELLED },
        });
        const live = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.LIVE },
        });
        const scheduled = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.SCHEDULED },
        });
        return { total, completed, cancelled, live, scheduled };
    }
};
exports.LiveSessionService = LiveSessionService;
exports.LiveSessionService = LiveSessionService = LiveSessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(live_session_entity_1.LiveSession)),
    __param(1, (0, typeorm_1.InjectRepository)(session_attendance_entity_1.SessionAttendance)),
    __param(2, (0, typeorm_1.InjectRepository)(zoom_integration_entity_1.ZoomIntegration)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        zoom_service_1.ZoomService,
        notifications_service_1.NotificationsService])
], LiveSessionService);
//# sourceMappingURL=live-session.service.js.map
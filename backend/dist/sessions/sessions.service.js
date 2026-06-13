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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_meeting_entity_1 = require("./entities/session-meeting.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let SessionService = class SessionService {
    constructor(sessionRepository, scheduleRepository, notificationService) {
        this.sessionRepository = sessionRepository;
        this.scheduleRepository = scheduleRepository;
        this.notificationService = notificationService;
    }
    async startMeeting(scheduleId, teacherId, meetingLink) {
        const schedule = await this.scheduleRepository.findOne({
            where: { id: scheduleId, teacherId },
            relations: ['student', 'teacher'],
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Schedule not found or not assigned to this teacher');
        }
        if (!meetingLink || (!meetingLink.includes('zoom') && !meetingLink.includes('meet'))) {
            throw new common_1.BadRequestException('Invalid meeting link. Must be Zoom or Google Meet link.');
        }
        const existingSession = await this.sessionRepository.findOne({
            where: {
                scheduleId,
                status: session_meeting_entity_1.SessionStatus.LIVE,
            },
        });
        if (existingSession) {
            throw new common_1.BadRequestException('A meeting is already live for this class');
        }
        const now = new Date();
        const session = this.sessionRepository.create({
            scheduleId,
            teacherId,
            meetingLink,
            status: session_meeting_entity_1.SessionStatus.LIVE,
            actualStartTime: now,
            teacherJoinTime: now,
            attendanceStatus: session_meeting_entity_1.TeacherAttendanceStatus.PRESENT,
        });
        const savedSession = await this.sessionRepository.save(session);
        const [students, parents, admins] = await Promise.all([
            this.getScheduleStudents(scheduleId),
            this.getStudentParents(scheduleId),
            this.getAdmins(),
        ]);
        const recipients = [
            ...students.map((s) => s.id),
            ...parents.map((p) => p.id),
            ...admins.map((a) => a.id),
        ];
        await this.notificationService.sendMeetingNotification(savedSession.id, recipients, {
            teacherName: schedule.teacher.fullName,
            className: schedule.className,
            meetingLink,
            scheduledTime: schedule.startTime,
        });
        return savedSession;
    }
    async endMeeting(sessionId) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.status !== session_meeting_entity_1.SessionStatus.LIVE) {
            throw new common_1.BadRequestException('Session is not live');
        }
        const now = new Date();
        session.status = session_meeting_entity_1.SessionStatus.ENDED;
        session.teacherLeaveTime = now;
        session.actualEndTime = now;
        if (session.teacherJoinTime) {
            const durationMs = now.getTime() - session.teacherJoinTime.getTime();
            session.totalDuration = Math.floor(durationMs / 60000);
        }
        return this.sessionRepository.save(session);
    }
    async getActiveSession(teacherId) {
        return this.sessionRepository.findOne({
            where: {
                teacherId,
                status: session_meeting_entity_1.SessionStatus.LIVE,
            },
            relations: ['schedule', 'studentAttendances', 'studentAttendances.student'],
        });
    }
    async getScheduleSession(scheduleId) {
        const today = new Date().toDateString();
        return this.sessionRepository.findOne({
            where: {
                scheduleId,
            },
            order: { createdAt: 'DESC' },
            relations: ['schedule', 'teacher', 'studentAttendances', 'studentAttendances.student'],
        });
    }
    async recordTeacherJoin(sessionId) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
            relations: ['schedule'],
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        const now = new Date();
        session.teacherJoinTime = now;
        session.actualStartTime = now;
        const scheduledStart = new Date(session.schedule.startTime);
        if (now > scheduledStart) {
            session.attendanceStatus = session_meeting_entity_1.TeacherAttendanceStatus.LATE;
        }
        else {
            session.attendanceStatus = session_meeting_entity_1.TeacherAttendanceStatus.PRESENT;
        }
        return this.sessionRepository.save(session);
    }
    async recordTeacherLeave(sessionId) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        const now = new Date();
        session.teacherLeaveTime = now;
        if (session.teacherJoinTime) {
            const durationMs = now.getTime() - session.teacherJoinTime.getTime();
            session.totalDuration = Math.floor(durationMs / 60000);
        }
        return this.sessionRepository.save(session);
    }
    async getSessionDetails(sessionId) {
        return this.sessionRepository.findOne({
            where: { id: sessionId },
            relations: ['schedule', 'teacher', 'studentAttendances', 'studentAttendances.student'],
        });
    }
    async getLiveSessionsForAdmin() {
        return this.sessionRepository.find({
            where: { status: session_meeting_entity_1.SessionStatus.LIVE },
            relations: ['schedule', 'teacher', 'studentAttendances', 'studentAttendances.student'],
            order: { createdAt: 'DESC' },
        });
    }
    async getSessionsForSchedule(scheduleId) {
        return this.sessionRepository.find({
            where: { scheduleId },
            relations: ['schedule', 'teacher', 'studentAttendances', 'studentAttendances.student'],
            order: { createdAt: 'DESC' },
        });
    }
    async getScheduleStudents(scheduleId) {
        const schedule = await this.scheduleRepository.findOne({
            where: { id: scheduleId },
            relations: ['student', 'student.user'],
        });
        return schedule?.student ? [schedule.student.user] : [];
    }
    async getStudentParents(scheduleId) {
        const schedule = await this.scheduleRepository.findOne({
            where: { id: scheduleId },
            relations: ['student', 'student.parent', 'student.parent.user'],
        });
        return schedule?.student?.parent?.user ? [schedule.student.parent.user] : [];
    }
    async getAdmins() {
        return [];
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_meeting_entity_1.SessionMeeting)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], SessionService);
//# sourceMappingURL=sessions.service.js.map
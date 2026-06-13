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
var ZoomWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomWebhookService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const live_session_entity_1 = require("./entities/live-session.entity");
const session_attendance_entity_1 = require("./entities/session-attendance.entity");
const live_session_status_enum_1 = require("./enums/live-session-status.enum");
const live_session_status_enum_2 = require("./enums/live-session-status.enum");
const zoom_service_1 = require("./zoom.service");
const session_attendance_service_1 = require("./session-attendance.service");
const notifications_service_1 = require("../notifications/notifications.service");
const student_entity_1 = require("../students/entities/student.entity");
const processed_webhook_entity_1 = require("./entities/processed-webhook.entity");
let ZoomWebhookService = ZoomWebhookService_1 = class ZoomWebhookService {
    constructor(liveSessionRepository, attendanceRepository, studentRepository, processedWebhookRepository, zoomService, sessionAttendanceService, notificationsService) {
        this.liveSessionRepository = liveSessionRepository;
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.processedWebhookRepository = processedWebhookRepository;
        this.zoomService = zoomService;
        this.sessionAttendanceService = sessionAttendanceService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(ZoomWebhookService_1.name);
    }
    async handleWebhook(event, payload, eventId) {
        this.logger.log(`Zoom webhook received: ${event}`);
        if (eventId) {
            const alreadyProcessed = await this.processedWebhookRepository.findOne({
                where: { eventId },
            });
            if (alreadyProcessed) {
                this.logger.log(`Skipping already-processed webhook event: ${eventId}`);
                return;
            }
        }
        switch (event) {
            case 'meeting.started':
                await this.handleMeetingStarted(payload);
                break;
            case 'meeting.ended':
                await this.handleMeetingEnded(payload);
                break;
            case 'participant.joined':
                await this.handleParticipantJoined(payload);
                break;
            case 'participant.left':
                await this.handleParticipantLeft(payload);
                break;
            default:
                this.logger.log(`Unhandled webhook event: ${event}`);
        }
        if (eventId) {
            try {
                await this.processedWebhookRepository.save(this.processedWebhookRepository.create({ eventId }));
            }
            catch {
            }
        }
    }
    async handleMeetingStarted(payload) {
        const zoomMeetingId = this.extractMeetingId(payload);
        if (!zoomMeetingId) {
            this.logger.warn('Meeting started webhook missing meeting ID');
            return;
        }
        const session = await this.liveSessionRepository.findOne({
            where: { zoomMeetingId },
            relations: ['attendances'],
        });
        if (!session) {
            this.logger.warn(`No live session found for Zoom meeting ${zoomMeetingId}`);
            return;
        }
        if (session.status === live_session_status_enum_1.LiveSessionStatus.SCHEDULED ||
            session.status === live_session_status_enum_1.LiveSessionStatus.LIVE) {
            session.status = live_session_status_enum_1.LiveSessionStatus.LIVE;
            session.actualStart = new Date();
            await this.liveSessionRepository.save(session);
        }
    }
    async handleMeetingEnded(payload) {
        const zoomMeetingId = this.extractMeetingId(payload);
        if (!zoomMeetingId) {
            this.logger.warn('Meeting ended webhook missing meeting ID');
            return;
        }
        const session = await this.liveSessionRepository.findOne({
            where: { zoomMeetingId },
        });
        if (!session) {
            this.logger.warn(`No live session found for Zoom meeting ${zoomMeetingId}`);
            return;
        }
        session.status = live_session_status_enum_1.LiveSessionStatus.COMPLETED;
        session.actualEnd = new Date();
        if (session.actualStart) {
            const durationMs = session.actualEnd.getTime() - session.actualStart.getTime();
            session.durationMinutes = Math.floor(durationMs / 60000);
        }
        await this.liveSessionRepository.save(session);
        const attendances = await this.attendanceRepository.find({
            where: { sessionId: session.id },
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
        const studentIds = attendances.map((a) => a.studentId);
        try {
            await this.notificationsService.sendCustomNotifications(studentIds, 'Class Completed', `Your class has ended. Duration: ${session.durationMinutes || 'N/A'} minutes.`, { sessionId: session.id, durationMinutes: session.durationMinutes });
        }
        catch (err) {
            this.logger.error('Failed to send completion notification', err);
        }
    }
    async handleParticipantJoined(payload) {
        const zoomMeetingId = this.extractMeetingId(payload);
        const participant = payload?.object?.participant;
        if (!zoomMeetingId || !participant) {
            this.logger.warn('Participant joined webhook missing data');
            return;
        }
        const session = await this.liveSessionRepository.findOne({
            where: { zoomMeetingId },
        });
        if (!session)
            return;
        const studentId = await this.resolveStudentFromParticipant(participant, session);
        if (!studentId)
            return;
        try {
            await this.sessionAttendanceService.recordJoin(session.id, studentId);
            this.logger.log(`Attendance recorded for student ${studentId} in session ${session.id}`);
        }
        catch (err) {
            this.logger.error(`Failed to record attendance for student ${studentId}`, err);
        }
    }
    async handleParticipantLeft(payload) {
        const zoomMeetingId = this.extractMeetingId(payload);
        const participant = payload?.object?.participant;
        if (!zoomMeetingId || !participant) {
            this.logger.warn('Participant left webhook missing data');
            return;
        }
        const session = await this.liveSessionRepository.findOne({
            where: { zoomMeetingId },
        });
        if (!session)
            return;
        const studentId = await this.resolveStudentFromParticipant(participant, session);
        if (!studentId)
            return;
        try {
            await this.sessionAttendanceService.recordLeave(session.id, studentId);
            this.logger.log(`Leave recorded for student ${studentId} in session ${session.id}`);
        }
        catch (err) {
            this.logger.error(`Failed to record leave for student ${studentId}`, err);
        }
    }
    async resolveStudentFromParticipant(participant, session) {
        const email = participant.email || '';
        const zoomUserId = (participant.userid || participant.id);
        const name = participant.user_name || '';
        if (email) {
            const student = await this.studentRepository.findOne({
                where: [{ email }, { zoomEmail: email }],
            });
            if (student)
                return student.id;
        }
        if (session.studentId) {
            return session.studentId;
        }
        if (zoomUserId) {
            const integration = await this.zoomService.getTeacherByZoomUserId(zoomUserId);
            if (integration) {
                return integration.teacherId;
            }
        }
        this.logger.warn(`Unable to resolve participant to student: email=${email} name=${name} zoomUserId=${zoomUserId}`);
        return null;
    }
    extractMeetingId(payload) {
        const object = payload?.object;
        if (!object?.id)
            return null;
        return String(object.id);
    }
};
exports.ZoomWebhookService = ZoomWebhookService;
exports.ZoomWebhookService = ZoomWebhookService = ZoomWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(live_session_entity_1.LiveSession)),
    __param(1, (0, typeorm_1.InjectRepository)(session_attendance_entity_1.SessionAttendance)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(processed_webhook_entity_1.ProcessedWebhook)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        zoom_service_1.ZoomService,
        session_attendance_service_1.SessionAttendanceService,
        notifications_service_1.NotificationsService])
], ZoomWebhookService);
//# sourceMappingURL=zoom-webhook.service.js.map
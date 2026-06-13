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
var SessionAttendanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionAttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_attendance_entity_1 = require("./entities/session-attendance.entity");
const live_session_entity_1 = require("./entities/live-session.entity");
const live_session_status_enum_1 = require("./enums/live-session-status.enum");
let SessionAttendanceService = SessionAttendanceService_1 = class SessionAttendanceService {
    constructor(attendanceRepository, liveSessionRepository) {
        this.attendanceRepository = attendanceRepository;
        this.liveSessionRepository = liveSessionRepository;
        this.logger = new common_1.Logger(SessionAttendanceService_1.name);
    }
    async recordJoin(sessionId, studentId) {
        const session = await this.liveSessionRepository.findOne({ where: { id: sessionId } });
        if (!session) {
            throw new common_1.NotFoundException('Live session not found');
        }
        let attendance = await this.attendanceRepository.findOne({
            where: { sessionId, studentId },
        });
        const now = new Date();
        const isLate = now > session.scheduledStart;
        if (!attendance) {
            attendance = this.attendanceRepository.create({
                sessionId,
                studentId,
                joinTime: now,
                attendanceStatus: isLate ? live_session_status_enum_1.AttendanceStatus.LATE : live_session_status_enum_1.AttendanceStatus.PRESENT,
            });
        }
        else {
            attendance.joinTime = now;
            if (attendance.attendanceStatus === live_session_status_enum_1.AttendanceStatus.ABSENT) {
                attendance.attendanceStatus = isLate ? live_session_status_enum_1.AttendanceStatus.LATE : live_session_status_enum_1.AttendanceStatus.PRESENT;
            }
        }
        return this.attendanceRepository.save(attendance);
    }
    async recordLeave(sessionId, studentId) {
        const session = await this.liveSessionRepository.findOne({ where: { id: sessionId } });
        if (!session) {
            throw new common_1.NotFoundException('Live session not found');
        }
        let attendance = await this.attendanceRepository.findOne({
            where: { sessionId, studentId },
        });
        if (!attendance) {
            attendance = this.attendanceRepository.create({
                sessionId,
                studentId,
                attendanceStatus: live_session_status_enum_1.AttendanceStatus.ABSENT,
            });
        }
        const now = new Date();
        attendance.leaveTime = now;
        if (attendance.joinTime) {
            attendance.duration = Math.floor((now.getTime() - attendance.joinTime.getTime()) / 60000);
        }
        if (attendance.joinTime && now < session.scheduledEnd) {
            attendance.attendanceStatus = live_session_status_enum_1.AttendanceStatus.LEFT_EARLY;
        }
        return this.attendanceRepository.save(attendance);
    }
    async markAbsent(sessionId, studentId) {
        let attendance = await this.attendanceRepository.findOne({
            where: { sessionId, studentId },
        });
        if (!attendance) {
            attendance = this.attendanceRepository.create({
                sessionId,
                studentId,
                attendanceStatus: live_session_status_enum_1.AttendanceStatus.ABSENT,
            });
        }
        else if (!attendance.joinTime) {
            attendance.attendanceStatus = live_session_status_enum_1.AttendanceStatus.ABSENT;
        }
        return this.attendanceRepository.save(attendance);
    }
    async getAttendanceForSession(sessionId) {
        return this.attendanceRepository.find({
            where: { sessionId },
            relations: ['student'],
            order: { joinTime: 'ASC' },
        });
    }
    async getAttendanceForStudent(studentId, page = 1, limit = 20) {
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
    async getAttendanceStats(studentId) {
        const attendances = await this.attendanceRepository.find({
            where: { studentId },
        });
        const total = attendances.length;
        const present = attendances.filter((a) => a.attendanceStatus === live_session_status_enum_1.AttendanceStatus.PRESENT).length;
        const late = attendances.filter((a) => a.attendanceStatus === live_session_status_enum_1.AttendanceStatus.LATE).length;
        const absent = attendances.filter((a) => a.attendanceStatus === live_session_status_enum_1.AttendanceStatus.ABSENT).length;
        const leftEarly = attendances.filter((a) => a.attendanceStatus === live_session_status_enum_1.AttendanceStatus.LEFT_EARLY).length;
        const attendancePercentage = total > 0 ? ((present + late) / total) * 100 : 0;
        return { total, present, late, absent, leftEarly, attendancePercentage };
    }
    async bulkCreateAttendance(sessionId, studentIds) {
        const existing = await this.attendanceRepository.find({
            where: { sessionId },
        });
        const existingStudentIds = new Set(existing.map((a) => a.studentId));
        const newRecords = studentIds
            .filter((sid) => !existingStudentIds.has(sid))
            .map((studentId) => this.attendanceRepository.create({
            sessionId,
            studentId,
            attendanceStatus: live_session_status_enum_1.AttendanceStatus.ABSENT,
        }));
        if (newRecords.length > 0) {
            await this.attendanceRepository.save(newRecords);
        }
    }
};
exports.SessionAttendanceService = SessionAttendanceService;
exports.SessionAttendanceService = SessionAttendanceService = SessionAttendanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_attendance_entity_1.SessionAttendance)),
    __param(1, (0, typeorm_1.InjectRepository)(live_session_entity_1.LiveSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SessionAttendanceService);
//# sourceMappingURL=session-attendance.service.js.map
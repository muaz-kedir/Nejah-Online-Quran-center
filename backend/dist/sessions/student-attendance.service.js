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
exports.StudentAttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_session_attendance_entity_1 = require("./entities/student-session-attendance.entity");
const session_meeting_entity_1 = require("./entities/session-meeting.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
let StudentAttendanceService = class StudentAttendanceService {
    constructor(attendanceRepository, sessionRepository, scheduleRepository) {
        this.attendanceRepository = attendanceRepository;
        this.sessionRepository = sessionRepository;
        this.scheduleRepository = scheduleRepository;
    }
    async recordStudentJoin(sessionId, studentId) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId },
            relations: ['schedule'],
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        let attendance = await this.attendanceRepository.findOne({
            where: { sessionMeetingId: sessionId, studentId },
        });
        if (attendance) {
            throw new common_1.BadRequestException('Student already joined this session');
        }
        const now = new Date();
        const scheduledStart = new Date(session.schedule.startTime);
        let status = student_session_attendance_entity_1.StudentAttendanceStatus.PRESENT;
        if (now > scheduledStart) {
            status = student_session_attendance_entity_1.StudentAttendanceStatus.LATE;
        }
        attendance = this.attendanceRepository.create({
            sessionMeetingId: sessionId,
            studentId,
            joinTime: now,
            attendanceStatus: status,
        });
        return this.attendanceRepository.save(attendance);
    }
    async recordStudentLeave(sessionId, studentId) {
        const attendance = await this.attendanceRepository.findOne({
            where: { sessionMeetingId: sessionId, studentId },
            relations: ['session', 'session.schedule'],
        });
        if (!attendance) {
            throw new common_1.NotFoundException('Student attendance record not found');
        }
        const now = new Date();
        attendance.leaveTime = now;
        const scheduledEnd = new Date(attendance.session.schedule.endTime);
        if (now < scheduledEnd && attendance.attendanceStatus === student_session_attendance_entity_1.StudentAttendanceStatus.PRESENT) {
            attendance.attendanceStatus = student_session_attendance_entity_1.StudentAttendanceStatus.LEFT_EARLY;
        }
        if (attendance.joinTime) {
            const durationMs = now.getTime() - attendance.joinTime.getTime();
            attendance.totalDuration = Math.floor(durationMs / 60000);
        }
        return this.attendanceRepository.save(attendance);
    }
    async calculateAttendanceStatus(studentId, sessionId) {
        const attendance = await this.attendanceRepository.findOne({
            where: { sessionMeetingId: sessionId, studentId },
            relations: ['session', 'session.schedule'],
        });
        if (!attendance) {
            return student_session_attendance_entity_1.StudentAttendanceStatus.ABSENT;
        }
        if (!attendance.joinTime) {
            return student_session_attendance_entity_1.StudentAttendanceStatus.ABSENT;
        }
        return attendance.attendanceStatus;
    }
    async getStudentAttendanceBySchedule(studentId, scheduleId) {
        const schedule = await this.scheduleRepository.findOne({
            where: { id: scheduleId },
        });
        if (!schedule) {
            throw new common_1.NotFoundException('Schedule not found');
        }
        return this.attendanceRepository.find({
            where: {
                studentId,
                session: { scheduleId },
            },
            relations: ['session', 'session.schedule', 'session.teacher'],
            order: { createdAt: 'DESC' },
        });
    }
    async getStudentAttendancePercentage(studentId, fromDate, toDate) {
        const [totalClasses, presentClasses] = await Promise.all([
            this.attendanceRepository.count({
                where: {
                    studentId,
                    createdAt: (0, typeorm_2.Between)(fromDate, toDate),
                },
            }),
            this.attendanceRepository.count({
                where: {
                    studentId,
                    attendanceStatus: student_session_attendance_entity_1.StudentAttendanceStatus.PRESENT,
                    createdAt: (0, typeorm_2.Between)(fromDate, toDate),
                },
            }),
        ]);
        if (totalClasses === 0)
            return 0;
        return (presentClasses / totalClasses) * 100;
    }
    async getStudentAttendanceHistory(studentId, limit = 50, offset = 0) {
        return this.attendanceRepository.find({
            where: { studentId },
            relations: ['session', 'session.schedule', 'session.teacher'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }
    async markAbsent(sessionId, studentId) {
        let attendance = await this.attendanceRepository.findOne({
            where: { sessionMeetingId: sessionId, studentId },
        });
        if (!attendance) {
            attendance = this.attendanceRepository.create({
                sessionMeetingId: sessionId,
                studentId,
                attendanceStatus: student_session_attendance_entity_1.StudentAttendanceStatus.ABSENT,
            });
        }
        else {
            attendance.attendanceStatus = student_session_attendance_entity_1.StudentAttendanceStatus.ABSENT;
        }
        return this.attendanceRepository.save(attendance);
    }
    async getSessionAttendance(sessionId) {
        return this.attendanceRepository.find({
            where: { sessionMeetingId: sessionId },
            relations: ['student', 'student.user', 'session'],
            order: { createdAt: 'DESC' },
        });
    }
};
exports.StudentAttendanceService = StudentAttendanceService;
exports.StudentAttendanceService = StudentAttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_session_attendance_entity_1.StudentSessionAttendance)),
    __param(1, (0, typeorm_1.InjectRepository)(session_meeting_entity_1.SessionMeeting)),
    __param(2, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StudentAttendanceService);
//# sourceMappingURL=student-attendance.service.js.map
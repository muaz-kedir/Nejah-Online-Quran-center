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
var ZoomAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const live_session_entity_1 = require("./entities/live-session.entity");
const session_attendance_entity_1 = require("./entities/session-attendance.entity");
const live_session_status_enum_1 = require("./enums/live-session-status.enum");
const live_session_status_enum_2 = require("./enums/live-session-status.enum");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
let ZoomAnalyticsService = ZoomAnalyticsService_1 = class ZoomAnalyticsService {
    constructor(liveSessionRepository, attendanceRepository, studentRepository, teacherRepository) {
        this.liveSessionRepository = liveSessionRepository;
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.logger = new common_1.Logger(ZoomAnalyticsService_1.name);
    }
    async getDashboardAnalytics() {
        const totalSessions = await this.liveSessionRepository.count();
        const completedSessions = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.COMPLETED },
        });
        const cancelledSessions = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.CANCELLED },
        });
        const liveSessions = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.LIVE },
        });
        const sessions = await this.liveSessionRepository.find({
            where: { status: live_session_status_enum_1.LiveSessionStatus.COMPLETED },
        });
        const totalDuration = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const averageSessionDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;
        const allAttendances = await this.attendanceRepository.find();
        const totalAttendances = allAttendances.length;
        const presentCount = allAttendances.filter((a) => a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.PRESENT ||
            a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.LATE).length;
        const attendanceRate = totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 0;
        const totalStudents = await this.studentRepository.count({
            where: { status: 'active' },
        });
        const totalTeachers = await this.teacherRepository.count();
        return {
            totalSessions,
            completedSessions,
            cancelledSessions,
            liveSessions,
            averageSessionDuration,
            attendanceRate: Math.round(attendanceRate * 100) / 100,
            totalStudents,
            totalTeachers,
            missedSessions: cancelledSessions,
            activeSessions: liveSessions,
        };
    }
    async getTeacherAnalytics(teacherId) {
        const sessions = await this.liveSessionRepository.find({
            where: { teacherId },
            relations: ['attendances'],
        });
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter((s) => s.status === live_session_status_enum_1.LiveSessionStatus.COMPLETED).length;
        const cancelledSessions = sessions.filter((s) => s.status === live_session_status_enum_1.LiveSessionStatus.CANCELLED).length;
        const liveSessions = sessions.filter((s) => s.status === live_session_status_enum_1.LiveSessionStatus.LIVE).length;
        const completed = sessions.filter((s) => s.status === live_session_status_enum_1.LiveSessionStatus.COMPLETED);
        const totalDuration = completed.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const averageSessionDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;
        const allAttendances = sessions.flatMap((s) => s.attendances || []);
        const presentCount = allAttendances.filter((a) => a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.PRESENT ||
            a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.LATE).length;
        const attendanceRate = allAttendances.length > 0 ? (presentCount / allAttendances.length) * 100 : 0;
        const studentIds = [...new Set(allAttendances.map((a) => a.studentId))];
        return {
            totalSessions,
            completedSessions,
            cancelledSessions,
            liveSessions,
            averageSessionDuration,
            attendanceRate: Math.round(attendanceRate * 100) / 100,
            totalStudents: studentIds.length,
            teacherUtilization: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        };
    }
    async getStudentAnalytics(studentId) {
        const attendances = await this.attendanceRepository.find({
            where: { studentId },
            relations: ['session'],
        });
        const totalSessions = attendances.length;
        const sessionsAttended = attendances.filter((a) => a.attendanceStatus !== live_session_status_enum_2.AttendanceStatus.ABSENT).length;
        const present = attendances.filter((a) => a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.PRESENT).length;
        const late = attendances.filter((a) => a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.LATE).length;
        const absent = attendances.filter((a) => a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.ABSENT).length;
        const leftEarly = attendances.filter((a) => a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.LEFT_EARLY).length;
        const totalDuration = attendances.reduce((sum, a) => sum + (a.duration || 0), 0);
        const averageDuration = sessionsAttended > 0 ? Math.round(totalDuration / sessionsAttended) : 0;
        const attendanceRate = totalSessions > 0 ? Math.round(((present + late) / totalSessions) * 100 * 100) / 100 : 0;
        return {
            totalSessions,
            sessionsAttended,
            present,
            late,
            absent,
            leftEarly,
            attendanceRate,
            totalDuration,
            averageDuration,
            engagement: totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : 0,
        };
    }
    async getMonthlyTrends(year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const sessions = await this.liveSessionRepository.find({
            where: {
                scheduledStart: (0, typeorm_2.Between)(startDate, endDate),
            },
            relations: ['attendances'],
        });
        const total = sessions.length;
        const completed = sessions.filter((s) => s.status === live_session_status_enum_1.LiveSessionStatus.COMPLETED).length;
        const cancelled = sessions.filter((s) => s.status === live_session_status_enum_1.LiveSessionStatus.CANCELLED).length;
        const totalDuration = sessions
            .filter((s) => s.status === live_session_status_enum_1.LiveSessionStatus.COMPLETED)
            .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const avgDuration = completed > 0 ? Math.round(totalDuration / completed) : 0;
        const allAttendances = sessions.flatMap((s) => s.attendances || []);
        const presentCount = allAttendances.filter((a) => a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.PRESENT ||
            a.attendanceStatus === live_session_status_enum_2.AttendanceStatus.LATE).length;
        const attendanceRate = allAttendances.length > 0 ? Math.round((presentCount / allAttendances.length) * 100) : 0;
        const sessionsByDay = {};
        sessions.forEach((s) => {
            const day = s.scheduledStart.toLocaleDateString('en-US', { weekday: 'long' });
            sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
        });
        return {
            month,
            year,
            totalSessions: total,
            completedSessions: completed,
            cancelledSessions: cancelled,
            averageDuration: avgDuration,
            attendanceRate,
            sessionsByDay,
        };
    }
    async getOverallStats() {
        const totalSessions = await this.liveSessionRepository.count();
        const completedSessions = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.COMPLETED },
        });
        const cancelledSessions = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.CANCELLED },
        });
        const liveSessions = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.LIVE },
        });
        const scheduledSessions = await this.liveSessionRepository.count({
            where: { status: live_session_status_enum_1.LiveSessionStatus.SCHEDULED },
        });
        const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
        return {
            totalSessions,
            completedSessions,
            cancelledSessions,
            liveSessions,
            scheduledSessions,
            completionRate,
        };
    }
};
exports.ZoomAnalyticsService = ZoomAnalyticsService;
exports.ZoomAnalyticsService = ZoomAnalyticsService = ZoomAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(live_session_entity_1.LiveSession)),
    __param(1, (0, typeorm_1.InjectRepository)(session_attendance_entity_1.SessionAttendance)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ZoomAnalyticsService);
//# sourceMappingURL=zoom-analytics.service.js.map
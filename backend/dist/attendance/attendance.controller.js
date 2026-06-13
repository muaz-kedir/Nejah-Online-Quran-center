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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const create_class_session_dto_1 = require("./dto/create-class-session.dto");
const start_meeting_dto_1 = require("./dto/start-meeting.dto");
const record_student_attendance_dto_1 = require("./dto/record-student-attendance.dto");
const end_session_dto_1 = require("./dto/end-session.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const teachers_service_1 = require("../teachers/teachers.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("../students/entities/student.entity");
const common_2 = require("@nestjs/common");
let AttendanceController = class AttendanceController {
    constructor(attendanceService, teachersService, studentsRepository) {
        this.attendanceService = attendanceService;
        this.teachersService = teachersService;
        this.studentsRepository = studentsRepository;
    }
    async resolveStudentIdForUser(req) {
        if (req.user.role === user_role_enum_1.UserRole.STUDENT) {
            const student = await this.studentsRepository.findOne({
                where: { userId: req.user.id },
            });
            if (!student) {
                throw new common_2.ForbiddenException('Student profile not found');
            }
            return student.id;
        }
        const queryId = req.query?.studentId;
        if (!queryId) {
            throw new common_2.ForbiddenException('studentId is required');
        }
        return queryId;
    }
    async resolveTeacherIdForUser(req) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
        return teacher.id;
    }
    async createSession(req, dto) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            dto.teacherId = await this.resolveTeacherIdForUser(req);
        }
        return this.attendanceService.createClassSession(dto);
    }
    async startMeeting(dto) {
        return this.attendanceService.startMeeting(dto);
    }
    async endSession(dto) {
        return this.attendanceService.endSession(dto);
    }
    async recordAttendance(req, dto) {
        if (req.user.role === user_role_enum_1.UserRole.STUDENT) {
            dto.studentId = await this.resolveStudentIdForUser(req);
        }
        else if (!dto.studentId) {
            throw new common_2.BadRequestException('studentId is required');
        }
        return this.attendanceService.recordStudentAttendance(dto);
    }
    async getSession(id) {
        return this.attendanceService.getClassSessionWithAttendance(id);
    }
    async getSessionByScheduleToday(req, scheduleId) {
        let requestingTeacherId;
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            requestingTeacherId = await this.resolveTeacherIdForUser(req);
            await this.teachersService.assertScheduleBelongsToTeacher(requestingTeacherId, scheduleId);
        }
        return this.attendanceService.getLiveClassSessionByScheduleToday(scheduleId, requestingTeacherId);
    }
    async getStudentLiveClass(req) {
        const studentId = await this.resolveStudentIdForUser(req);
        return this.attendanceService.getStudentLiveClass(studentId);
    }
    async getTeacherSessions(req, date, teacherIdQuery) {
        const teacherId = req.user.role === user_role_enum_1.UserRole.TEACHER ? await this.resolveTeacherIdForUser(req) : teacherIdQuery;
        const sessionDate = date ? new Date(date) : undefined;
        return this.attendanceService.getTeacherSessions(teacherId, sessionDate);
    }
    async getStudentHistory(req, studentIdQuery) {
        const studentId = await this.resolveStudentIdForUser({
            user: req.user,
            query: { studentId: studentIdQuery },
        });
        return this.attendanceService.getStudentAttendanceHistory(studentId);
    }
    async getStudentStats(req, studentIdQuery) {
        const studentId = await this.resolveStudentIdForUser({
            user: req.user,
            query: { studentId: studentIdQuery },
        });
        return this.attendanceService.getAttendanceStats(studentId);
    }
    async getLiveClasses() {
        return this.attendanceService.getLiveClasses();
    }
    async getTodaysSessions(req) {
        const teacherId = req.user.role === user_role_enum_1.UserRole.TEACHER ? await this.resolveTeacherIdForUser(req) : undefined;
        return this.attendanceService.getTodaysSessions(teacherId);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('sessions'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_class_session_dto_1.CreateClassSessionDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "createSession", null);
__decorate([
    (0, common_1.Post)('sessions/start-meeting'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [start_meeting_dto_1.StartMeetingDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "startMeeting", null);
__decorate([
    (0, common_1.Post)('sessions/end'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [end_session_dto_1.EndSessionDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "endSession", null);
__decorate([
    (0, common_1.Post)('record'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, record_student_attendance_dto_1.RecordStudentAttendanceDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "recordAttendance", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getSession", null);
__decorate([
    (0, common_1.Get)('sessions/by-schedule-today/:scheduleId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('scheduleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getSessionByScheduleToday", null);
__decorate([
    (0, common_1.Get)('student/live'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStudentLiveClass", null);
__decorate([
    (0, common_1.Get)('teacher/sessions'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getTeacherSessions", null);
__decorate([
    (0, common_1.Get)('student/history'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStudentHistory", null);
__decorate([
    (0, common_1.Get)('student/stats'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStudentStats", null);
__decorate([
    (0, common_1.Get)('live-classes'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getLiveClasses", null);
__decorate([
    (0, common_1.Get)('todays-sessions'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getTodaysSessions", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService,
        teachers_service_1.TeachersService,
        typeorm_2.Repository])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map
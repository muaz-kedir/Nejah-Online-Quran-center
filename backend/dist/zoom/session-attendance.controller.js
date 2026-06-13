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
exports.SessionAttendanceController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_attendance_service_1 = require("./session-attendance.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const parent_entity_1 = require("../parents/entities/parent.entity");
const student_entity_1 = require("../students/entities/student.entity");
let SessionAttendanceController = class SessionAttendanceController {
    constructor(sessionAttendanceService, parentRepository, studentRepository) {
        this.sessionAttendanceService = sessionAttendanceService;
        this.parentRepository = parentRepository;
        this.studentRepository = studentRepository;
    }
    async getStudentAttendance(req, studentId, page, limit) {
        if (req.user.role === user_role_enum_1.UserRole.PARENT) {
            const parent = await this.parentRepository.findOne({
                where: { user: { id: req.user.id } },
                relations: ['students'],
            });
            if (!parent || !parent.students.some((s) => s.id === studentId)) {
                throw new common_1.ForbiddenException('You can only view your own children\'s attendance');
            }
        }
        if (req.user.role === user_role_enum_1.UserRole.STUDENT) {
            const student = await this.studentRepository.findOne({
                where: { id: studentId, userId: req.user.id },
            });
            if (!student) {
                throw new common_1.ForbiddenException('You can only view your own attendance');
            }
        }
        return this.sessionAttendanceService.getAttendanceForStudent(studentId, page, limit);
    }
    async getStudentAttendanceStats(req, studentId) {
        if (req.user.role === user_role_enum_1.UserRole.PARENT) {
            const parent = await this.parentRepository.findOne({
                where: { user: { id: req.user.id } },
                relations: ['students'],
            });
            if (!parent || !parent.students.some((s) => s.id === studentId)) {
                throw new common_1.ForbiddenException('You can only view your own children\'s attendance stats');
            }
        }
        if (req.user.role === user_role_enum_1.UserRole.STUDENT) {
            const student = await this.studentRepository.findOne({
                where: { id: studentId, userId: req.user.id },
            });
            if (!student) {
                throw new common_1.ForbiddenException('You can only view your own attendance stats');
            }
        }
        return this.sessionAttendanceService.getAttendanceStats(studentId);
    }
    async getSessionAttendance(sessionId) {
        return this.sessionAttendanceService.getAttendanceForSession(sessionId);
    }
};
exports.SessionAttendanceController = SessionAttendanceController;
__decorate([
    (0, common_1.Get)('student/:studentId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], SessionAttendanceController.prototype, "getStudentAttendance", null);
__decorate([
    (0, common_1.Get)('student/:studentId/stats'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionAttendanceController.prototype, "getStudentAttendanceStats", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionAttendanceController.prototype, "getSessionAttendance", null);
exports.SessionAttendanceController = SessionAttendanceController = __decorate([
    (0, common_1.Controller)('session-attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(1, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [session_attendance_service_1.SessionAttendanceService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SessionAttendanceController);
//# sourceMappingURL=session-attendance.controller.js.map
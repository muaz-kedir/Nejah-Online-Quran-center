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
exports.LiveSessionController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const live_session_service_1 = require("./live-session.service");
const session_attendance_service_1 = require("./session-attendance.service");
const create_live_session_dto_1 = require("./dto/create-live-session.dto");
const update_live_session_dto_1 = require("./dto/update-live-session.dto");
const query_live_session_dto_1 = require("./dto/query-live-session.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const teachers_service_1 = require("../teachers/teachers.service");
const parent_entity_1 = require("../parents/entities/parent.entity");
const student_entity_1 = require("../students/entities/student.entity");
let LiveSessionController = class LiveSessionController {
    constructor(liveSessionService, sessionAttendanceService, teachersService, parentRepository, studentRepository) {
        this.liveSessionService = liveSessionService;
        this.sessionAttendanceService = sessionAttendanceService;
        this.teachersService = teachersService;
        this.parentRepository = parentRepository;
        this.studentRepository = studentRepository;
    }
    async create(req, dto) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            dto.teacherId = teacher.id;
        }
        return this.liveSessionService.create(dto);
    }
    async createWithZoom(req, dto) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            dto.teacherId = teacher.id;
        }
        return this.liveSessionService.createWithZoom(dto);
    }
    async findAll(query) {
        return this.liveSessionService.findAll(query);
    }
    async getUpcoming(req, studentId) {
        let teacherId;
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            teacherId = teacher.id;
        }
        return this.liveSessionService.getUpcoming(teacherId, studentId);
    }
    async getLiveSessions() {
        return this.liveSessionService.getLiveSessions();
    }
    async getTodaysSessions(req) {
        let teacherId;
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            teacherId = teacher.id;
        }
        return this.liveSessionService.getTodaysSessions(teacherId);
    }
    async getStats() {
        return this.liveSessionService.getSessionStats();
    }
    async getTeacherSessions(req, page, limit) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            return this.liveSessionService.getTeacherSessions(teacher.id, page, limit);
        }
        throw new common_1.ForbiddenException('Teacher access required');
    }
    async getStudentSessions(req, studentId, page, limit) {
        if (req.user.role === user_role_enum_1.UserRole.PARENT) {
            const parent = await this.parentRepository.findOne({
                where: { user: { id: req.user.id } },
                relations: ['students'],
            });
            if (!parent || !parent.students.some((s) => s.id === studentId)) {
                throw new common_1.ForbiddenException('You can only view your own children\'s sessions');
            }
        }
        if (req.user.role === user_role_enum_1.UserRole.STUDENT) {
            const student = await this.studentRepository.findOne({
                where: { id: studentId, userId: req.user.id },
            });
            if (!student) {
                throw new common_1.ForbiddenException('You can only view your own sessions');
            }
        }
        return this.liveSessionService.getStudentSessions(studentId, page, limit);
    }
    async findOne(id) {
        return this.liveSessionService.findById(id);
    }
    async update(id, dto, req) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            dto.teacherId = teacher.id;
        }
        return this.liveSessionService.update(id, dto);
    }
    async start(id, req) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
        return this.liveSessionService.start(teacher.id, id);
    }
    async complete(id) {
        return this.liveSessionService.complete(id);
    }
    async cancel(id) {
        return this.liveSessionService.cancel(id);
    }
};
exports.LiveSessionController = LiveSessionController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_live_session_dto_1.CreateLiveSessionDto]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('with-zoom'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_live_session_dto_1.CreateLiveSessionDto]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "createWithZoom", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_live_session_dto_1.QueryLiveSessionDto]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "getLiveSessions", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "getTodaysSessions", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('teacher'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "getTeacherSessions", null);
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
], LiveSessionController.prototype, "getStudentSessions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_live_session_dto_1.UpdateLiveSessionDto, Object]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LiveSessionController.prototype, "cancel", null);
exports.LiveSessionController = LiveSessionController = __decorate([
    (0, common_1.Controller)('live-sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(3, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(4, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [live_session_service_1.LiveSessionService,
        session_attendance_service_1.SessionAttendanceService,
        teachers_service_1.TeachersService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LiveSessionController);
//# sourceMappingURL=live-session.controller.js.map
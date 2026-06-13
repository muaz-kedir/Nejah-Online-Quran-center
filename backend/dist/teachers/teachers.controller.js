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
exports.TeachersController = void 0;
const common_1 = require("@nestjs/common");
const teachers_service_1 = require("./teachers.service");
const create_teacher_dto_1 = require("./dto/create-teacher.dto");
const update_teacher_dto_1 = require("./dto/update-teacher.dto");
const query_teacher_dto_1 = require("./dto/query-teacher.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let TeachersController = class TeachersController {
    constructor(teachersService) {
        this.teachersService = teachersService;
    }
    authenticatedUserId(req) {
        const userId = req.user?.id;
        if (!userId) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        return userId;
    }
    async getTeacherDashboard(req) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(this.authenticatedUserId(req));
        return this.teachersService.getTeacherDashboardData(teacher.id);
    }
    async getMyDashboardStats(req) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(this.authenticatedUserId(req));
        return this.teachersService.getTeacherDashboardStats(teacher.id);
    }
    async getTeacherStudents(req, query) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(this.authenticatedUserId(req));
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 10;
        return this.teachersService.getTeacherStudents(teacher.id, page, limit);
    }
    async getTeacherStudent(req, studentId) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(this.authenticatedUserId(req));
        return this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
    }
    async getTeacherSchedule(req) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(this.authenticatedUserId(req));
        return this.teachersService.getTeacherSchedule(teacher.id);
    }
    async getTeacherNotifications(req, query) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(this.authenticatedUserId(req));
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 20;
        return this.teachersService.getTeacherNotifications(teacher.id, page, limit);
    }
    create(createTeacherDto) {
        return this.teachersService.create(createTeacherDto);
    }
    getOverallStats() {
        return this.teachersService.getOverallStats();
    }
    findAll(queryDto) {
        return this.teachersService.findAll(queryDto);
    }
    findOne(id) {
        return this.teachersService.findOne(id);
    }
    getAnalytics(id) {
        return this.teachersService.getTeacherAnalytics(id);
    }
    update(id, updateTeacherDto) {
        return this.teachersService.update(id, updateTeacherDto);
    }
    remove(id) {
        return this.teachersService.remove(id);
    }
    assignStudents(id, studentIds) {
        return this.teachersService.assignStudents(id, studentIds);
    }
};
exports.TeachersController = TeachersController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getTeacherDashboard", null);
__decorate([
    (0, common_1.Get)('my-dashboard-stats'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getMyDashboardStats", null);
__decorate([
    (0, common_1.Get)('students'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getTeacherStudents", null);
__decorate([
    (0, common_1.Get)('students/:studentId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getTeacherStudent", null);
__decorate([
    (0, common_1.Get)('schedule'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getTeacherSchedule", null);
__decorate([
    (0, common_1.Get)('notifications'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getTeacherNotifications", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_teacher_dto_1.CreateTeacherDto]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "getOverallStats", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_teacher_dto_1.QueryTeacherDto]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_teacher_dto_1.UpdateTeacherDto]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/assign-students'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('studentIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "assignStudents", null);
exports.TeachersController = TeachersController = __decorate([
    (0, common_1.Controller)('teachers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [teachers_service_1.TeachersService])
], TeachersController);
//# sourceMappingURL=teachers.controller.js.map
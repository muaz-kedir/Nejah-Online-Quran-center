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
exports.ZoomAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const zoom_analytics_service_1 = require("./zoom-analytics.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const teachers_service_1 = require("../teachers/teachers.service");
const parent_entity_1 = require("../parents/entities/parent.entity");
const student_entity_1 = require("../students/entities/student.entity");
let ZoomAnalyticsController = class ZoomAnalyticsController {
    constructor(zoomAnalyticsService, teachersService, parentRepository, studentRepository) {
        this.zoomAnalyticsService = zoomAnalyticsService;
        this.teachersService = teachersService;
        this.parentRepository = parentRepository;
        this.studentRepository = studentRepository;
    }
    async getDashboardAnalytics() {
        return this.zoomAnalyticsService.getDashboardAnalytics();
    }
    async getTeacherAnalytics(req) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
        return this.zoomAnalyticsService.getTeacherAnalytics(teacher.id);
    }
    async getTeacherAnalyticsById(teacherId) {
        return this.zoomAnalyticsService.getTeacherAnalytics(teacherId);
    }
    async getStudentAnalytics(req, studentId) {
        if (req.user.role === user_role_enum_1.UserRole.PARENT) {
            const parent = await this.parentRepository.findOne({
                where: { user: { id: req.user.id } },
                relations: ['students'],
            });
            if (!parent || !parent.students.some((s) => s.id === studentId)) {
                throw new common_1.ForbiddenException('You can only view your own children\'s analytics');
            }
        }
        if (req.user.role === user_role_enum_1.UserRole.STUDENT) {
            const student = await this.studentRepository.findOne({
                where: { id: studentId, userId: req.user.id },
            });
            if (!student) {
                throw new common_1.ForbiddenException('You can only view your own analytics');
            }
        }
        return this.zoomAnalyticsService.getStudentAnalytics(studentId);
    }
    async getMonthlyTrends(year, month) {
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) || new Date().getMonth() + 1;
        return this.zoomAnalyticsService.getMonthlyTrends(y, m);
    }
    async getOverview() {
        return this.zoomAnalyticsService.getOverallStats();
    }
};
exports.ZoomAnalyticsController = ZoomAnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ZoomAnalyticsController.prototype, "getDashboardAnalytics", null);
__decorate([
    (0, common_1.Get)('teacher'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ZoomAnalyticsController.prototype, "getTeacherAnalytics", null);
__decorate([
    (0, common_1.Get)('teacher/:teacherId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ZoomAnalyticsController.prototype, "getTeacherAnalyticsById", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ZoomAnalyticsController.prototype, "getStudentAnalytics", null);
__decorate([
    (0, common_1.Get)('monthly'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ZoomAnalyticsController.prototype, "getMonthlyTrends", null);
__decorate([
    (0, common_1.Get)('overview'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ZoomAnalyticsController.prototype, "getOverview", null);
exports.ZoomAnalyticsController = ZoomAnalyticsController = __decorate([
    (0, common_1.Controller)('zoom-analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __param(2, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [zoom_analytics_service_1.ZoomAnalyticsService,
        teachers_service_1.TeachersService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ZoomAnalyticsController);
//# sourceMappingURL=zoom-analytics.controller.js.map
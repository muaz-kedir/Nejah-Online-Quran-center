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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getSummary(query) {
        const dateRange = {};
        if (query.startDate) {
            dateRange.startDate = query.startDate;
        }
        if (query.endDate) {
            dateRange.endDate = query.endDate;
        }
        return this.reportsService.getSummaryStatistics(dateRange);
    }
    async getStudentPerformance(query) {
        const filters = {};
        if (query.learningProgram) {
            filters.learningProgram = query.learningProgram;
        }
        if (query.status) {
            filters.status = query.status;
        }
        if (query.teacherId) {
            filters.teacherId = query.teacherId;
        }
        if (query.country) {
            filters.country = query.country;
        }
        if (query.search) {
            filters.search = query.search;
        }
        if (query.startDate) {
            filters.dateRange = { ...filters.dateRange, startDate: query.startDate };
        }
        if (query.endDate) {
            filters.dateRange = { ...filters.dateRange, endDate: query.endDate };
        }
        if (query.page) {
            filters.page = parseInt(query.page, 10);
        }
        if (query.limit) {
            filters.limit = parseInt(query.limit, 10);
        }
        return this.reportsService.getStudentPerformance(filters);
    }
    async getTeacherActivity(query) {
        const filters = {};
        if (query.startDate) {
            filters.dateRange = { ...filters.dateRange, startDate: query.startDate };
        }
        if (query.endDate) {
            filters.dateRange = { ...filters.dateRange, endDate: query.endDate };
        }
        if (query.status) {
            filters.status = query.status;
        }
        if (query.country) {
            filters.country = query.country;
        }
        if (query.page) {
            filters.page = parseInt(query.page, 10);
        }
        if (query.limit) {
            filters.limit = parseInt(query.limit, 10);
        }
        return this.reportsService.getTeacherActivity(filters);
    }
    async getAttendanceAnalytics(query) {
        const filters = {};
        if (query.startDate) {
            filters.startDate = query.startDate;
        }
        if (query.endDate) {
            filters.endDate = query.endDate;
        }
        if (query.teacherId) {
            filters.teacherId = query.teacherId;
        }
        if (query.studentId) {
            filters.studentId = query.studentId;
        }
        return this.reportsService.getAttendanceAnalytics(filters);
    }
    async getProgressAnalytics(query) {
        const filters = {};
        if (query.learningProgram) {
            filters.learningProgram = query.learningProgram;
        }
        if (query.status) {
            filters.status = query.status;
        }
        return this.reportsService.getProgressAnalytics(filters);
    }
    async getRegistrationReports(query) {
        const filters = {};
        if (query.startDate) {
            filters.startDate = query.startDate;
        }
        if (query.endDate) {
            filters.endDate = query.endDate;
        }
        if (query.country) {
            filters.country = query.country;
        }
        if (query.level) {
            filters.level = query.level;
        }
        return this.reportsService.getRegistrationReports(filters);
    }
    async getParentActivityReports(query) {
        const filters = {};
        if (query.startDate) {
            filters.startDate = query.startDate;
        }
        if (query.endDate) {
            filters.endDate = query.endDate;
        }
        if (query.country) {
            filters.country = query.country;
        }
        return this.reportsService.getParentActivityReports(filters);
    }
    async getHomeworkReports(query) {
        const filters = {};
        if (query.startDate) {
            filters.startDate = query.startDate;
        }
        if (query.endDate) {
            filters.endDate = query.endDate;
        }
        if (query.difficulty) {
            filters.difficulty = query.difficulty;
        }
        if (query.status) {
            filters.status = query.status;
        }
        return this.reportsService.getHomeworkReports(filters);
    }
    async getExamReports(query) {
        const filters = {};
        if (query.startDate) {
            filters.startDate = query.startDate;
        }
        if (query.endDate) {
            filters.endDate = query.endDate;
        }
        if (query.status) {
            filters.status = query.status;
        }
        if (query.learningTrack) {
            filters.learningTrack = query.learningTrack;
        }
        return this.reportsService.getExamReports(filters);
    }
    async getTeacherReplacementReports(query) {
        const filters = {};
        if (query.startDate) {
            filters.startDate = query.startDate;
        }
        if (query.endDate) {
            filters.endDate = query.endDate;
        }
        if (query.status) {
            filters.status = query.status;
        }
        if (query.reason) {
            filters.reason = query.reason;
        }
        return this.reportsService.getTeacherReplacementReports(filters);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('students/performance'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getStudentPerformance", null);
__decorate([
    (0, common_1.Get)('teachers/activity'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTeacherActivity", null);
__decorate([
    (0, common_1.Get)('attendance/analytics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getAttendanceAnalytics", null);
__decorate([
    (0, common_1.Get)('progress/analytics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getProgressAnalytics", null);
__decorate([
    (0, common_1.Get)('registrations'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getRegistrationReports", null);
__decorate([
    (0, common_1.Get)('parents/activity'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getParentActivityReports", null);
__decorate([
    (0, common_1.Get)('homework'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getHomeworkReports", null);
__decorate([
    (0, common_1.Get)('exams'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getExamReports", null);
__decorate([
    (0, common_1.Get)('teacher-replacements'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTeacherReplacementReports", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map
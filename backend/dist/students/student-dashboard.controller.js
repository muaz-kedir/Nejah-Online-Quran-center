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
exports.StudentDashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const student_portal_service_1 = require("./student-portal.service");
let StudentDashboardController = class StudentDashboardController {
    constructor(portal) {
        this.portal = portal;
    }
    getDashboard(req) {
        return this.portal.getDashboard(req.user.id);
    }
    getClasses(req) {
        return this.portal.getClasses(req.user.id);
    }
    getProgress(req) {
        return this.portal.getProgressDetail(req.user.id);
    }
    getHomework(req) {
        return this.portal.getHomeworkList(req.user.id);
    }
    submitHomework(req, id, body) {
        return this.portal.submitHomework(req.user.id, id, body.submissionNotes);
    }
    getNotifications(req) {
        return this.portal.getNotifications(req.user.id);
    }
    markNotificationRead(req, id) {
        return this.portal.markNotificationRead(req.user.id, id);
    }
    markAllNotificationsRead(req) {
        return this.portal.markAllNotificationsRead(req.user.id);
    }
    getFeedback(req) {
        return this.portal.getFeedback(req.user.id);
    }
    getAttendance(req) {
        return this.portal.getAttendanceDetail(req.user.id);
    }
    getResources(search, category) {
        return this.portal.getResources(search, category);
    }
    getProfile(req) {
        return this.portal.getProfile(req.user.id);
    }
};
exports.StudentDashboardController = StudentDashboardController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/classes'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "getClasses", null);
__decorate([
    (0, common_1.Get)('dashboard/progress'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Get)('dashboard/homework'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "getHomework", null);
__decorate([
    (0, common_1.Post)('dashboard/homework/:id/submit'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "submitHomework", null);
__decorate([
    (0, common_1.Get)('dashboard/notifications'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('dashboard/notifications/:id/read'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "markNotificationRead", null);
__decorate([
    (0, common_1.Patch)('dashboard/notifications/read-all'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "markAllNotificationsRead", null);
__decorate([
    (0, common_1.Get)('dashboard/feedback'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "getFeedback", null);
__decorate([
    (0, common_1.Get)('dashboard/attendance'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "getAttendance", null);
__decorate([
    (0, common_1.Get)('dashboard/resources'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "getResources", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentDashboardController.prototype, "getProfile", null);
exports.StudentDashboardController = StudentDashboardController = __decorate([
    (0, common_1.Controller)('student'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT),
    __metadata("design:paramtypes", [student_portal_service_1.StudentPortalService])
], StudentDashboardController);
//# sourceMappingURL=student-dashboard.controller.js.map
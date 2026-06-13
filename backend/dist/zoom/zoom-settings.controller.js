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
exports.ZoomSettingsController = void 0;
const common_1 = require("@nestjs/common");
const zoom_service_1 = require("./zoom.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const teachers_service_1 = require("../teachers/teachers.service");
const class_validator_1 = require("class-validator");
class ConnectZoomDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectZoomDto.prototype, "zoomUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectZoomDto.prototype, "zoomEmail", void 0);
let ZoomSettingsController = class ZoomSettingsController {
    constructor(zoomService, teachersService) {
        this.zoomService = zoomService;
        this.teachersService = teachersService;
    }
    async connect(req, dto) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
        return this.zoomService.saveTeacherIntegration(teacher.id, dto.zoomUserId, dto.zoomEmail || '');
    }
    async disconnect(req) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
        return this.zoomService.disconnectTeacher(teacher.id);
    }
    async getStatus(req) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
        return this.zoomService.getTeacherIntegration(teacher.id);
    }
    async getAll() {
        return this.zoomService.getAllIntegrations();
    }
    async getZoomUser(zoomUserId) {
        return this.zoomService.getZoomUser(zoomUserId);
    }
};
exports.ZoomSettingsController = ZoomSettingsController;
__decorate([
    (0, common_1.Post)('connect'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ConnectZoomDto]),
    __metadata("design:returntype", Promise)
], ZoomSettingsController.prototype, "connect", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ZoomSettingsController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ZoomSettingsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ZoomSettingsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('user/:zoomUserId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('zoomUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ZoomSettingsController.prototype, "getZoomUser", null);
exports.ZoomSettingsController = ZoomSettingsController = __decorate([
    (0, common_1.Controller)('zoom-settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [zoom_service_1.ZoomService,
        teachers_service_1.TeachersService])
], ZoomSettingsController);
//# sourceMappingURL=zoom-settings.controller.js.map
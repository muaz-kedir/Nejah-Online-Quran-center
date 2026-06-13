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
exports.TeacherApplicationsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const teacher_applications_service_1 = require("./teacher-applications.service");
const create_teacher_application_dto_1 = require("./dto/create-teacher-application.dto");
const review_teacher_application_dto_1 = require("./dto/review-teacher-application.dto");
const query_teacher_application_dto_1 = require("./dto/query-teacher-application.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const UPLOAD_DIR = (0, path_1.join)(process.cwd(), 'uploads', 'applications');
if (!(0, fs_1.existsSync)(UPLOAD_DIR)) {
    (0, fs_1.mkdirSync)(UPLOAD_DIR, { recursive: true });
}
let TeacherApplicationsController = class TeacherApplicationsController {
    constructor(applicationsService) {
        this.applicationsService = applicationsService;
    }
    getSettings() {
        return this.applicationsService.getSettings();
    }
    submit(dto) {
        return this.applicationsService.submit(dto);
    }
    uploadDocument(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        return { url: `/uploads/applications/${file.filename}` };
    }
    trackApplication(email, applicationNumber) {
        if (!email || !applicationNumber) {
            throw new common_1.BadRequestException('Both email and application number are required');
        }
        return this.applicationsService.trackApplication(email, applicationNumber);
    }
    getStats() {
        return this.applicationsService.getStats();
    }
    toggleSettings(body) {
        return this.applicationsService.toggleApplicationsOpen(body.isApplicationsOpen);
    }
    findAll(queryDto) {
        return this.applicationsService.findAll(queryDto);
    }
    findOne(id) {
        return this.applicationsService.findOne(id);
    }
    review(id, dto, req) {
        const reviewerId = req.user?.id || 'unknown';
        return this.applicationsService.review(id, dto, reviewerId);
    }
};
exports.TeacherApplicationsController = TeacherApplicationsController;
__decorate([
    (0, common_1.Get)('settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TeacherApplicationsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_teacher_application_dto_1.CreateTeacherApplicationDto]),
    __metadata("design:returntype", void 0)
], TeacherApplicationsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: UPLOAD_DIR,
            filename: (_req, file, cb) => {
                const ext = (0, path_1.extname)(file.originalname);
                const name = (0, crypto_1.randomBytes)(16).toString('hex');
                cb(null, `${name}${ext}`);
            },
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowed.includes(file.mimetype)) {
                cb(new common_1.BadRequestException('Only PDF, JPG and PNG files are allowed'), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherApplicationsController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)('track'),
    __param(0, (0, common_1.Query)('email')),
    __param(1, (0, common_1.Query)('applicationNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeacherApplicationsController.prototype, "trackApplication", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TeacherApplicationsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('settings/toggle'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeacherApplicationsController.prototype, "toggleSettings", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_teacher_application_dto_1.QueryTeacherApplicationDto]),
    __metadata("design:returntype", void 0)
], TeacherApplicationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeacherApplicationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/review'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_teacher_application_dto_1.ReviewTeacherApplicationDto, Object]),
    __metadata("design:returntype", void 0)
], TeacherApplicationsController.prototype, "review", null);
exports.TeacherApplicationsController = TeacherApplicationsController = __decorate([
    (0, common_1.Controller)('teacher-applications'),
    __metadata("design:paramtypes", [teacher_applications_service_1.TeacherApplicationsService])
], TeacherApplicationsController);
//# sourceMappingURL=teacher-applications.controller.js.map
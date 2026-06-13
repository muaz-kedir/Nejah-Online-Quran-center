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
exports.ProgressController = void 0;
const common_1 = require("@nestjs/common");
const progress_service_1 = require("./progress.service");
const level_progression_service_1 = require("./level-progression.service");
const update_progress_dto_1 = require("./dto/update-progress.dto");
const create_feedback_dto_1 = require("./dto/create-feedback.dto");
const level_action_dto_1 = require("./dto/level-action.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const teachers_service_1 = require("../teachers/teachers.service");
let ProgressController = class ProgressController {
    constructor(progressService, levelProgressionService, teachersService) {
        this.progressService = progressService;
        this.levelProgressionService = levelProgressionService;
        this.teachersService = teachersService;
    }
    getProgressionSettings() {
        return this.levelProgressionService.getSettings();
    }
    updateProgressionSettings(dto) {
        return this.levelProgressionService.updateSettings(dto);
    }
    getSurahs() {
        return this.progressService.getSurahList();
    }
    async getLearningContext(req, studentId) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
        }
        else if (req.user.role === user_role_enum_1.UserRole.STUDENT || req.user.role === user_role_enum_1.UserRole.PARENT) {
            await this.progressService.assertUserCanViewStudentProgress(req.user.id, req.user.role, studentId);
        }
        return this.progressService.getLearningContext(studentId);
    }
    async getProgress(req, studentId) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
        }
        else if (req.user.role === user_role_enum_1.UserRole.STUDENT || req.user.role === user_role_enum_1.UserRole.PARENT) {
            await this.progressService.assertUserCanViewStudentProgress(req.user.id, req.user.role, studentId);
        }
        return this.progressService.getOrCreateProgress(studentId);
    }
    async getLearningPath(req, studentId) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
        }
        else if (req.user.role === user_role_enum_1.UserRole.STUDENT || req.user.role === user_role_enum_1.UserRole.PARENT) {
            await this.progressService.assertUserCanViewStudentProgress(req.user.id, req.user.role, studentId);
        }
        return this.levelProgressionService.getLearningPath(studentId);
    }
    async getLevelHistory(req, studentId) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
        }
        else if (req.user.role === user_role_enum_1.UserRole.STUDENT || req.user.role === user_role_enum_1.UserRole.PARENT) {
            await this.progressService.assertUserCanViewStudentProgress(req.user.id, req.user.role, studentId);
        }
        const history = await this.levelProgressionService.getLevelHistory(studentId);
        return history.map((h) => ({
            id: h.id,
            level: h.level,
            learningTrack: h.learningTrack,
            startedAt: h.startedAt,
            completedAt: h.completedAt,
            status: h.status,
            changeType: h.changeType,
            teacherName: h.teacher?.fullName || null,
            progressPercentage: h.progressPercentageSnapshot,
            reason: h.reason,
            createdAt: h.createdAt,
        }));
    }
    async applyLevelAction(req, studentId, dto) {
        return this.levelProgressionService.applyManualAction(studentId, dto, req.user.id);
    }
    async recommendPromotion(req, studentId, dto) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanManageStudent(teacher.id, studentId);
        }
        await this.levelProgressionService.recommendPromotion(studentId, req.user.id, dto.reason);
        return { success: true, message: 'Student promoted to the next level' };
    }
    async getProgressLogs(req, studentId, limit) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
        }
        else if (req.user.role === user_role_enum_1.UserRole.STUDENT || req.user.role === user_role_enum_1.UserRole.PARENT) {
            await this.progressService.assertUserCanViewStudentProgress(req.user.id, req.user.role, studentId);
        }
        const parsedLimit = limit ? parseInt(limit, 10) : 50;
        return this.progressService.getStudentLogs(studentId, parsedLimit);
    }
    async logProgress(req, studentId, dto) {
        let teacherId;
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanManageStudent(teacher.id, studentId);
            teacherId = teacher.id;
        }
        return this.progressService.logProgress(studentId, dto, teacherId);
    }
    async addFeedback(req, studentId, dto) {
        let teacherId;
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanManageStudent(teacher.id, studentId);
            teacherId = teacher.id;
        }
        else {
            teacherId = req.user.id;
        }
        return this.progressService.addFeedback(teacherId, studentId, dto.content);
    }
    async getFeedback(req, studentId) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
        }
        else if (req.user.role === user_role_enum_1.UserRole.STUDENT || req.user.role === user_role_enum_1.UserRole.PARENT) {
            await this.progressService.assertUserCanViewStudentProgress(req.user.id, req.user.role, studentId);
        }
        return this.progressService.getStudentFeedback(studentId);
    }
};
exports.ProgressController = ProgressController;
__decorate([
    (0, common_1.Get)('progression-settings'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProgressController.prototype, "getProgressionSettings", null);
__decorate([
    (0, common_1.Patch)('progression-settings'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [level_action_dto_1.UpdateProgressionSettingsDto]),
    __metadata("design:returntype", void 0)
], ProgressController.prototype, "updateProgressionSettings", null);
__decorate([
    (0, common_1.Get)('surahs'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProgressController.prototype, "getSurahs", null);
__decorate([
    (0, common_1.Get)('student/:studentId/learning-context'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getLearningContext", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Get)('student/:studentId/learning-path'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getLearningPath", null);
__decorate([
    (0, common_1.Get)('student/:studentId/level-history'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getLevelHistory", null);
__decorate([
    (0, common_1.Post)('student/:studentId/level-action'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, level_action_dto_1.LevelActionDto]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "applyLevelAction", null);
__decorate([
    (0, common_1.Post)('student/:studentId/recommend-promotion'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, level_action_dto_1.RecommendPromotionDto]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "recommendPromotion", null);
__decorate([
    (0, common_1.Get)('student/:studentId/logs'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getProgressLogs", null);
__decorate([
    (0, common_1.Patch)('student/:studentId/log'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_progress_dto_1.UpdateProgressDto]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "logProgress", null);
__decorate([
    (0, common_1.Post)('student/:studentId/feedback'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_feedback_dto_1.CreateFeedbackDto]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "addFeedback", null);
__decorate([
    (0, common_1.Get)('student/:studentId/feedback'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProgressController.prototype, "getFeedback", null);
exports.ProgressController = ProgressController = __decorate([
    (0, common_1.Controller)('progress'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [progress_service_1.ProgressService,
        level_progression_service_1.LevelProgressionService,
        teachers_service_1.TeachersService])
], ProgressController);
//# sourceMappingURL=progress.controller.js.map
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
exports.TeacherReplacementsController = void 0;
const common_1 = require("@nestjs/common");
const teacher_replacements_service_1 = require("./teacher-replacements.service");
const create_teacher_replacement_dto_1 = require("./dto/create-teacher-replacement.dto");
const update_teacher_replacement_dto_1 = require("./dto/update-teacher-replacement.dto");
const start_replacement_class_dto_1 = require("./dto/start-replacement-class.dto");
const query_teacher_replacement_dto_1 = require("./dto/query-teacher-replacement.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let TeacherReplacementsController = class TeacherReplacementsController {
    constructor(replacementsService) {
        this.replacementsService = replacementsService;
    }
    create(req, dto) {
        return this.replacementsService.create(dto, req.user.id);
    }
    findAll(req, query) {
        return this.replacementsService.findAll(query);
    }
    getTemporaryStudents(teacherId) {
        return this.replacementsService.getTemporaryStudentsForTeacher(teacherId);
    }
    getReassignedAway(teacherId) {
        return this.replacementsService.getReassignedAwayForTeacher(teacherId);
    }
    findOne(id) {
        return this.replacementsService.findOne(id);
    }
    update(req, id, dto) {
        return this.replacementsService.update(id, dto, req.user.id);
    }
    cancel(req, id) {
        return this.replacementsService.cancel(id, req.user.id);
    }
    startClass(req, id, dto) {
        return this.replacementsService.startReplacementClass(id, req.user, dto.meetingLink);
    }
};
exports.TeacherReplacementsController = TeacherReplacementsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_teacher_replacement_dto_1.CreateTeacherReplacementDto]),
    __metadata("design:returntype", void 0)
], TeacherReplacementsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_teacher_replacement_dto_1.QueryTeacherReplacementDto]),
    __metadata("design:returntype", void 0)
], TeacherReplacementsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('temporary-students/:teacherId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeacherReplacementsController.prototype, "getTemporaryStudents", null);
__decorate([
    (0, common_1.Get)('reassigned-away/:teacherId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeacherReplacementsController.prototype, "getReassignedAway", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeacherReplacementsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_teacher_replacement_dto_1.UpdateTeacherReplacementDto]),
    __metadata("design:returntype", void 0)
], TeacherReplacementsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeacherReplacementsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/start-class'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, start_replacement_class_dto_1.StartReplacementClassDto]),
    __metadata("design:returntype", void 0)
], TeacherReplacementsController.prototype, "startClass", null);
exports.TeacherReplacementsController = TeacherReplacementsController = __decorate([
    (0, common_1.Controller)('teacher-replacements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [teacher_replacements_service_1.TeacherReplacementsService])
], TeacherReplacementsController);
//# sourceMappingURL=teacher-replacements.controller.js.map
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
exports.HomeworkController = void 0;
const common_1 = require("@nestjs/common");
const homework_service_1 = require("./homework.service");
const create_homework_dto_1 = require("./dto/create-homework.dto");
const update_homework_status_dto_1 = require("./dto/update-homework-status.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const teachers_service_1 = require("../teachers/teachers.service");
const teacher_replacements_service_1 = require("../teacher-replacements/teacher-replacements.service");
let HomeworkController = class HomeworkController {
    constructor(homeworkService, teachersService, replacementsService) {
        this.homeworkService = homeworkService;
        this.teachersService = teachersService;
        this.replacementsService = replacementsService;
    }
    async create(req, dto) {
        let assignedByTeacherId;
        let replacementAssignmentId;
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanManageStudent(teacher.id, dto.studentId);
            assignedByTeacherId = teacher.id;
            const replacement = await this.replacementsService.getActiveReplacement(dto.studentId);
            if (replacement?.replacementTeacherId === teacher.id) {
                replacementAssignmentId = replacement.id;
            }
        }
        return this.homeworkService.create(dto, assignedByTeacherId, replacementAssignmentId);
    }
    async findByStudent(req, studentId) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertTeacherCanViewStudent(teacher.id, studentId);
        }
        return this.homeworkService.findByStudent(studentId);
    }
    async updateStatus(req, id, dto) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            const homework = await this.homeworkService.findOne(id);
            await this.teachersService.assertTeacherCanManageStudent(teacher.id, homework.studentId);
        }
        return this.homeworkService.updateStatus(id, dto.status);
    }
    async remove(req, id) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            const homework = await this.homeworkService.findOne(id);
            await this.teachersService.assertTeacherCanManageStudent(teacher.id, homework.studentId);
        }
        await this.homeworkService.remove(id);
        return { message: 'Homework deleted successfully' };
    }
};
exports.HomeworkController = HomeworkController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_homework_dto_1.CreateHomeworkDto]),
    __metadata("design:returntype", Promise)
], HomeworkController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HomeworkController.prototype, "findByStudent", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_homework_status_dto_1.UpdateHomeworkStatusDto]),
    __metadata("design:returntype", Promise)
], HomeworkController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HomeworkController.prototype, "remove", null);
exports.HomeworkController = HomeworkController = __decorate([
    (0, common_1.Controller)('homework'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [homework_service_1.HomeworkService,
        teachers_service_1.TeachersService,
        teacher_replacements_service_1.TeacherReplacementsService])
], HomeworkController);
//# sourceMappingURL=homework.controller.js.map
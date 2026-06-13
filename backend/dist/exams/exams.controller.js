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
exports.ExamsController = void 0;
const common_1 = require("@nestjs/common");
const exams_service_1 = require("./exams.service");
const create_exam_dto_1 = require("./dto/create-exam.dto");
const update_exam_dto_1 = require("./dto/update-exam.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let ExamsController = class ExamsController {
    constructor(examsService) {
        this.examsService = examsService;
    }
    create(createExamDto) {
        return this.examsService.create(createExamDto);
    }
    findAll(query) {
        return this.examsService.findAll(query);
    }
    findOne(id) {
        return this.examsService.findOne(id);
    }
    update(id, updateExamDto) {
        return this.examsService.update(id, updateExamDto);
    }
    remove(id) {
        return this.examsService.remove(id);
    }
    gradeExam(id, score, maxScore, feedback) {
        return this.examsService.gradeExam(id, score, maxScore, feedback);
    }
    gradeExamDirect(id, gradeData) {
        return this.examsService.gradeExam(id, gradeData.score, gradeData.maxScore, gradeData.feedback);
    }
};
exports.ExamsController = ExamsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_exam_dto_1.CreateExamDto]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.STUDENT),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.STUDENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_exam_dto_1.UpdateExamDto]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/grade'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('score')),
    __param(2, (0, common_1.Body)('maxScore')),
    __param(3, (0, common_1.Body)('feedback')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "gradeExam", null);
__decorate([
    (0, common_1.Patch)(':id/grade'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "gradeExamDirect", null);
exports.ExamsController = ExamsController = __decorate([
    (0, common_1.Controller)('exams'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [exams_service_1.ExamsService])
], ExamsController);
//# sourceMappingURL=exams.controller.js.map
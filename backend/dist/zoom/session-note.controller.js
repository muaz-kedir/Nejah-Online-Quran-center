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
exports.SessionNoteController = void 0;
const common_1 = require("@nestjs/common");
const session_note_service_1 = require("./session-note.service");
const create_session_note_dto_1 = require("./dto/create-session-note.dto");
const update_session_note_dto_1 = require("./dto/update-session-note.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const teachers_service_1 = require("../teachers/teachers.service");
let SessionNoteController = class SessionNoteController {
    constructor(sessionNoteService, teachersService) {
        this.sessionNoteService = sessionNoteService;
        this.teachersService = teachersService;
    }
    async create(req, dto) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
        dto.teacherId = teacher.id;
        return this.sessionNoteService.create(dto);
    }
    async findBySession(sessionId) {
        return this.sessionNoteService.findBySession(sessionId);
    }
    async update(req, id, dto) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
        return this.sessionNoteService.update(id, teacher.id, dto);
    }
    async delete(req, id) {
        const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
        return this.sessionNoteService.delete(id, teacher.id);
    }
};
exports.SessionNoteController = SessionNoteController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_session_note_dto_1.CreateSessionNoteDto]),
    __metadata("design:returntype", Promise)
], SessionNoteController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionNoteController.prototype, "findBySession", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_session_note_dto_1.UpdateSessionNoteDto]),
    __metadata("design:returntype", Promise)
], SessionNoteController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionNoteController.prototype, "delete", null);
exports.SessionNoteController = SessionNoteController = __decorate([
    (0, common_1.Controller)('session-notes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [session_note_service_1.SessionNoteService,
        teachers_service_1.TeachersService])
], SessionNoteController);
//# sourceMappingURL=session-note.controller.js.map
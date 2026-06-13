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
exports.SchedulesController = void 0;
const common_1 = require("@nestjs/common");
const schedules_service_1 = require("./schedules.service");
const create_schedule_dto_1 = require("./dto/create-schedule.dto");
const update_schedule_dto_1 = require("./dto/update-schedule.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const teachers_service_1 = require("../teachers/teachers.service");
let SchedulesController = class SchedulesController {
    constructor(schedulesService, teachersService) {
        this.schedulesService = schedulesService;
        this.teachersService = teachersService;
    }
    async create(req, createScheduleDto) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            createScheduleDto.teacherId = teacher.id;
        }
        return this.schedulesService.createSchedule(createScheduleDto);
    }
    async findAll(req, studentId, teacherId) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            return this.schedulesService.findAll(studentId, teacher.id);
        }
        return this.schedulesService.findAll(studentId, teacherId);
    }
    async getStudentSchedules(req, studentId) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertStudentBelongsToTeacher(teacher.id, studentId);
        }
        return this.schedulesService.getStudentSchedules(studentId);
    }
    async getTeacherSchedules(req, teacherId) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            if (teacherId !== teacher.id) {
                throw new common_1.ForbiddenException('You can only view your own schedule');
            }
        }
        return this.schedulesService.getTeacherSchedules(teacherId);
    }
    async getTeacherSchedulesByDay(req, teacherId, day) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            if (teacherId !== teacher.id) {
                throw new common_1.ForbiddenException('You can only view your own schedule');
            }
        }
        return this.schedulesService.getTeacherSchedulesByDay(teacherId, day);
    }
    async findOne(req, id) {
        const schedule = await this.schedulesService.findOne(id);
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            if (schedule.teacherId !== teacher.id) {
                throw new common_1.ForbiddenException('You do not have access to this schedule');
            }
        }
        return schedule;
    }
    async update(req, id, updateScheduleDto) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertScheduleBelongsToTeacher(teacher.id, id);
            updateScheduleDto.teacherId = teacher.id;
        }
        return this.schedulesService.updateSchedule(id, updateScheduleDto);
    }
    async remove(req, id) {
        if (req.user.role === user_role_enum_1.UserRole.TEACHER) {
            const teacher = await this.teachersService.resolveAuthenticatedTeacher(req.user.id);
            await this.teachersService.assertScheduleBelongsToTeacher(teacher.id, id);
        }
        return this.schedulesService.deleteSchedule(id);
    }
};
exports.SchedulesController = SchedulesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_schedule_dto_1.CreateScheduleDto]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('studentId')),
    __param(2, (0, common_1.Query)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "getStudentSchedules", null);
__decorate([
    (0, common_1.Get)('teacher/:teacherId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "getTeacherSchedules", null);
__decorate([
    (0, common_1.Get)('teacher/:teacherId/day/:day'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('teacherId')),
    __param(2, (0, common_1.Param)('day')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "getTeacherSchedulesByDay", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.PARENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_schedule_dto_1.UpdateScheduleDto]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SchedulesController.prototype, "remove", null);
exports.SchedulesController = SchedulesController = __decorate([
    (0, common_1.Controller)('schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [schedules_service_1.SchedulesService,
        teachers_service_1.TeachersService])
], SchedulesController);
//# sourceMappingURL=schedules.controller.js.map
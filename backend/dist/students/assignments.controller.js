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
exports.AssignmentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const students_service_1 = require("./students.service");
const schedules_service_1 = require("../schedules/schedules.service");
const assign_student_dto_1 = require("./dto/assign-student.dto");
let AssignmentsController = class AssignmentsController {
    constructor(studentsService, schedulesService) {
        this.studentsService = studentsService;
        this.schedulesService = schedulesService;
    }
    async getUnassignedStudents() {
        return this.studentsService.findAllUnassigned();
    }
    async assignStudent(dto) {
        const { studentId, teacherId, schedules } = dto;
        const student = await this.studentsService.findOne(studentId);
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        await this.schedulesService.clearStudentSchedules(studentId);
        await this.studentsService.update(studentId, {
            teacherId,
            isAssigned: true,
        });
        const results = [];
        if (schedules?.length) {
            for (const slot of schedules) {
                const schedule = await this.schedulesService.createSchedule({
                    studentId,
                    teacherId,
                    ...slot,
                });
                results.push(schedule);
            }
        }
        return {
            message: 'Student assigned successfully',
            schedules: results,
        };
    }
    async unassignStudent(dto) {
        const { studentId } = dto;
        await this.studentsService.unassignFromTeacher(studentId);
        await this.schedulesService.clearStudentSchedules(studentId);
        return { message: 'Student unassigned successfully' };
    }
};
exports.AssignmentsController = AssignmentsController;
__decorate([
    (0, common_1.Get)('unassigned'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "getUnassignedStudents", null);
__decorate([
    (0, common_1.Post)('assign'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_student_dto_1.AssignStudentDto]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "assignStudent", null);
__decorate([
    (0, common_1.Post)('unassign'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_student_dto_1.UnassignStudentDto]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "unassignStudent", null);
exports.AssignmentsController = AssignmentsController = __decorate([
    (0, common_1.Controller)('students/assignments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __metadata("design:paramtypes", [students_service_1.StudentsService,
        schedules_service_1.SchedulesService])
], AssignmentsController);
//# sourceMappingURL=assignments.controller.js.map
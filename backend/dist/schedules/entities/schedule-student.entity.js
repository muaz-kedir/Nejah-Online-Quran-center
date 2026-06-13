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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleStudent = void 0;
const typeorm_1 = require("typeorm");
const schedule_entity_1 = require("./schedule.entity");
const student_entity_1 = require("../../students/entities/student.entity");
let ScheduleStudent = class ScheduleStudent {
};
exports.ScheduleStudent = ScheduleStudent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ScheduleStudent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScheduleStudent.prototype, "scheduleId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ScheduleStudent.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_entity_1.Schedule, (schedule) => schedule.scheduleStudents, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'scheduleId' }),
    __metadata("design:type", schedule_entity_1.Schedule)
], ScheduleStudent.prototype, "schedule", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], ScheduleStudent.prototype, "student", void 0);
exports.ScheduleStudent = ScheduleStudent = __decorate([
    (0, typeorm_1.Entity)('schedule_students')
], ScheduleStudent);
//# sourceMappingURL=schedule-student.entity.js.map
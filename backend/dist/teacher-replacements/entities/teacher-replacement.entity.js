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
exports.TeacherReplacement = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("../../students/entities/student.entity");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const replacement_status_enum_1 = require("../../common/enums/replacement-status.enum");
const replacement_reason_enum_1 = require("../../common/enums/replacement-reason.enum");
let TeacherReplacement = class TeacherReplacement {
};
exports.TeacherReplacement = TeacherReplacement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], TeacherReplacement.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "originalTeacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'originalTeacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], TeacherReplacement.prototype, "originalTeacher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "replacementTeacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'replacementTeacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], TeacherReplacement.prototype, "replacementTeacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "startTimeString", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "endTimeString", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "meetingLink", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "classSessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: replacement_reason_enum_1.ReplacementReason }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "customReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: replacement_status_enum_1.ReplacementStatus, default: replacement_status_enum_1.ReplacementStatus.UPCOMING }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'createdBy' }),
    __metadata("design:type", user_entity_1.User)
], TeacherReplacement.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherReplacement.prototype, "cancelledBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], TeacherReplacement.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], TeacherReplacement.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TeacherReplacement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TeacherReplacement.prototype, "updatedAt", void 0);
exports.TeacherReplacement = TeacherReplacement = __decorate([
    (0, typeorm_1.Entity)('teacher_replacements')
], TeacherReplacement);
//# sourceMappingURL=teacher-replacement.entity.js.map
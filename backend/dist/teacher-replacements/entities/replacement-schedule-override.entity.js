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
exports.ReplacementScheduleOverride = void 0;
const typeorm_1 = require("typeorm");
const teacher_replacement_entity_1 = require("./teacher-replacement.entity");
const schedule_entity_1 = require("../../schedules/entities/schedule.entity");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
let ReplacementScheduleOverride = class ReplacementScheduleOverride {
};
exports.ReplacementScheduleOverride = ReplacementScheduleOverride;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReplacementScheduleOverride.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ReplacementScheduleOverride.prototype, "replacementId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_replacement_entity_1.TeacherReplacement, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'replacementId' }),
    __metadata("design:type", teacher_replacement_entity_1.TeacherReplacement)
], ReplacementScheduleOverride.prototype, "replacement", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ReplacementScheduleOverride.prototype, "originalScheduleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_entity_1.Schedule, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'originalScheduleId' }),
    __metadata("design:type", schedule_entity_1.Schedule)
], ReplacementScheduleOverride.prototype, "originalSchedule", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ReplacementScheduleOverride.prototype, "replacementTeacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'replacementTeacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], ReplacementScheduleOverride.prototype, "replacementTeacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ReplacementScheduleOverride.prototype, "meetingLink", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ReplacementScheduleOverride.prototype, "startTimeString", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ReplacementScheduleOverride.prototype, "endTimeString", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'active' }),
    __metadata("design:type", String)
], ReplacementScheduleOverride.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ReplacementScheduleOverride.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ReplacementScheduleOverride.prototype, "updatedAt", void 0);
exports.ReplacementScheduleOverride = ReplacementScheduleOverride = __decorate([
    (0, typeorm_1.Entity)('replacement_schedule_overrides')
], ReplacementScheduleOverride);
//# sourceMappingURL=replacement-schedule-override.entity.js.map
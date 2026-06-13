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
exports.Exam = exports.ExamStatus = exports.ExamDifficulty = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("../../students/entities/student.entity");
const progress_entity_1 = require("../../progress/entities/progress.entity");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
var ExamDifficulty;
(function (ExamDifficulty) {
    ExamDifficulty["EASY"] = "Easy";
    ExamDifficulty["MEDIUM"] = "Medium";
    ExamDifficulty["HARD"] = "Hard";
})(ExamDifficulty || (exports.ExamDifficulty = ExamDifficulty = {}));
var ExamStatus;
(function (ExamStatus) {
    ExamStatus["SCHEDULED"] = "Scheduled";
    ExamStatus["IN_PROGRESS"] = "In Progress";
    ExamStatus["COMPLETED"] = "Completed";
})(ExamStatus || (exports.ExamStatus = ExamStatus = {}));
let Exam = class Exam {
};
exports.Exam = Exam;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Exam.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Exam.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Exam.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Exam.prototype, "scheduledDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", Number)
], Exam.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ExamDifficulty, default: ExamDifficulty.MEDIUM }),
    __metadata("design:type", String)
], Exam.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ExamStatus, default: ExamStatus.SCHEDULED }),
    __metadata("design:type", String)
], Exam.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Exam.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Exam.prototype, "maxScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Exam.prototype, "feedback", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Exam.prototype, "isGraded", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Exam.prototype, "correctAnswers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Exam.prototype, "studentAnswers", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], Exam.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Exam.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], Exam.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Exam.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => progress_entity_1.Progress, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'progressId' }),
    __metadata("design:type", progress_entity_1.Progress)
], Exam.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Exam.prototype, "progressId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Exam.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Exam.prototype, "updatedAt", void 0);
exports.Exam = Exam = __decorate([
    (0, typeorm_1.Entity)('exams')
], Exam);
//# sourceMappingURL=exam.entity.js.map
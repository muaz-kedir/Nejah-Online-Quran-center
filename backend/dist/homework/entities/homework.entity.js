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
exports.Homework = exports.HomeworkStatus = exports.HomeworkDifficulty = void 0;
const typeorm_1 = require("typeorm");
const student_entity_1 = require("../../students/entities/student.entity");
var HomeworkDifficulty;
(function (HomeworkDifficulty) {
    HomeworkDifficulty["EASY"] = "Easy";
    HomeworkDifficulty["MEDIUM"] = "Medium";
    HomeworkDifficulty["HIGH"] = "High";
})(HomeworkDifficulty || (exports.HomeworkDifficulty = HomeworkDifficulty = {}));
var HomeworkStatus;
(function (HomeworkStatus) {
    HomeworkStatus["PENDING"] = "Pending";
    HomeworkStatus["COMPLETED"] = "Completed";
})(HomeworkStatus || (exports.HomeworkStatus = HomeworkStatus = {}));
let Homework = class Homework {
};
exports.Homework = Homework;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Homework.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Homework.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Homework.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: HomeworkDifficulty, default: HomeworkDifficulty.MEDIUM }),
    __metadata("design:type", String)
], Homework.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: HomeworkStatus, default: HomeworkStatus.PENDING }),
    __metadata("design:type", String)
], Homework.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Homework.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'studentId' }),
    __metadata("design:type", student_entity_1.Student)
], Homework.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Homework.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Homework.prototype, "assignedByTeacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Homework.prototype, "replacementAssignmentId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Homework.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Homework.prototype, "updatedAt", void 0);
exports.Homework = Homework = __decorate([
    (0, typeorm_1.Entity)('homework')
], Homework);
//# sourceMappingURL=homework.entity.js.map
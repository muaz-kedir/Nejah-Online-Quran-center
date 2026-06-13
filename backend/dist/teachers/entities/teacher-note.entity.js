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
exports.TeacherNote = exports.TeacherNoteType = void 0;
const typeorm_1 = require("typeorm");
const teacher_entity_1 = require("./teacher.entity");
var TeacherNoteType;
(function (TeacherNoteType) {
    TeacherNoteType["CLASS_REMINDER"] = "Class Reminder";
    TeacherNoteType["OBSERVATION"] = "Observation";
    TeacherNoteType["GENERAL_REMINDER"] = "General Reminder";
})(TeacherNoteType || (exports.TeacherNoteType = TeacherNoteType = {}));
let TeacherNote = class TeacherNote {
};
exports.TeacherNote = TeacherNote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeacherNote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TeacherNoteType, default: TeacherNoteType.GENERAL_REMINDER }),
    __metadata("design:type", String)
], TeacherNote.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherNote.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TeacherNote.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], TeacherNote.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherNote.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TeacherNote.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TeacherNote.prototype, "updatedAt", void 0);
exports.TeacherNote = TeacherNote = __decorate([
    (0, typeorm_1.Entity)('teacher_notes')
], TeacherNote);
//# sourceMappingURL=teacher-note.entity.js.map
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
exports.SessionNote = void 0;
const typeorm_1 = require("typeorm");
const live_session_entity_1 = require("./live-session.entity");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
let SessionNote = class SessionNote {
};
exports.SessionNote = SessionNote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SessionNote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => live_session_entity_1.LiveSession, (session) => session.sessionNotes, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", live_session_entity_1.LiveSession)
], SessionNote.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SessionNote.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], SessionNote.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SessionNote.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SessionNote.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SessionNote.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SessionNote.prototype, "updatedAt", void 0);
exports.SessionNote = SessionNote = __decorate([
    (0, typeorm_1.Entity)('session_notes')
], SessionNote);
//# sourceMappingURL=session-note.entity.js.map
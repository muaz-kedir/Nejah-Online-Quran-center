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
exports.Student = exports.StudentStatus = exports.AgeRange = exports.QuranLevel = void 0;
const typeorm_1 = require("typeorm");
const parent_entity_1 = require("../../parents/entities/parent.entity");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const typeorm_2 = require("typeorm");
const gender_enum_1 = require("../../common/enums/gender.enum");
const schedule_entity_1 = require("../../schedules/entities/schedule.entity");
var QuranLevel;
(function (QuranLevel) {
    QuranLevel["QAIDA_NOORANIYA"] = "Qaida Nooraniya";
    QuranLevel["QURAN_READING"] = "Quran Reading";
    QuranLevel["HIFZ_PROGRAM"] = "Hifz Program";
    QuranLevel["TAJWEED_PROGRAM"] = "Tajweed Program";
    QuranLevel["HIFZ_MURAJAA"] = "Hifz Muraja'a";
})(QuranLevel || (exports.QuranLevel = QuranLevel = {}));
var AgeRange;
(function (AgeRange) {
    AgeRange["UNDER_18"] = "Under 18";
    AgeRange["EIGHTEEN_TO_TWENTY_FIVE"] = "18 - 25";
    AgeRange["ABOVE_TWENTY_FIVE"] = "Above 25";
})(AgeRange || (exports.AgeRange = AgeRange = {}));
var StudentStatus;
(function (StudentStatus) {
    StudentStatus["ACTIVE"] = "active";
    StudentStatus["INACTIVE"] = "inactive";
    StudentStatus["PENDING"] = "pending";
})(StudentStatus || (exports.StudentStatus = StudentStatus = {}));
let Student = class Student {
};
exports.Student = Student;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Student.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Student.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: gender_enum_1.Gender, default: gender_enum_1.Gender.MALE }),
    __metadata("design:type", String)
], Student.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: AgeRange.UNDER_18 }),
    __metadata("design:type", String)
], Student.prototype, "ageRange", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "currentResidency", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', default: QuranLevel.QURAN_READING }),
    __metadata("design:type", String)
], Student.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Student.prototype, "progressionPaused", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Student.prototype, "kitabRequested", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "kitabName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Student.prototype, "previousTraining", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "trainingDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "referralSource", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Student.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "zoomEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE }),
    __metadata("design:type", String)
], Student.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Student.prototype, "statusChangedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "statusChangedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "statusChangeReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "statusNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Student.prototype, "isAssigned", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "familyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "familyPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "familyAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "familyCountry", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "learningGoals", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Student.prototype, "attendanceRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Student.prototype, "progressRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "studentCode", void 0);
__decorate([
    (0, typeorm_2.OneToOne)(() => user_entity_1.User, { cascade: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Student.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => parent_entity_1.Parent, (parent) => parent.students, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'parentId' }),
    __metadata("design:type", parent_entity_1.Parent)
], Student.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => teacher_entity_1.Teacher, (teacher) => teacher.students, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], Student.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Student.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_2.OneToMany)(() => schedule_entity_1.Schedule, (schedule) => schedule.student),
    __metadata("design:type", Array)
], Student.prototype, "schedules", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Student.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Student.prototype, "updatedAt", void 0);
exports.Student = Student = __decorate([
    (0, typeorm_1.Entity)('students')
], Student);
//# sourceMappingURL=student.entity.js.map
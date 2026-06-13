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
exports.TeacherApplication = exports.ApplicationStatus = void 0;
const typeorm_1 = require("typeorm");
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["PENDING_REVIEW"] = "PENDING_REVIEW";
    ApplicationStatus["APPROVED"] = "APPROVED";
    ApplicationStatus["REJECTED"] = "REJECTED";
    ApplicationStatus["MORE_INFO_REQUIRED"] = "MORE_INFO_REQUIRED";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
let TeacherApplication = class TeacherApplication {
};
exports.TeacherApplication = TeacherApplication;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeacherApplication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "applicationNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherApplication.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherApplication.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherApplication.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherApplication.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TeacherApplication.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "streetAddress", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array'),
    __metadata("design:type", Array)
], TeacherApplication.prototype, "languages", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "internetConnectionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "qiratEducationLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "islamicEducationLevel", void 0);
__decorate([
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], TeacherApplication.prototype, "teachingTimeAvailability", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "marketingSource", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "nationalIdUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "quranCertificateUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "islamicCertificateUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "teachingExperienceUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "cvResumeUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "additionalComments", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ApplicationStatus,
        default: ApplicationStatus.PENDING_REVIEW,
    }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "adminNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "infoRequestMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], TeacherApplication.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TeacherApplication.prototype, "createdTeacherId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TeacherApplication.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TeacherApplication.prototype, "updatedAt", void 0);
exports.TeacherApplication = TeacherApplication = __decorate([
    (0, typeorm_1.Entity)('teacher_applications')
], TeacherApplication);
//# sourceMappingURL=teacher-application.entity.js.map
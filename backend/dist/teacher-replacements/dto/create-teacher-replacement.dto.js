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
exports.CreateTeacherReplacementDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const replacement_reason_enum_1 = require("../../common/enums/replacement-reason.enum");
class CreateTeacherReplacementDto {
}
exports.CreateTeacherReplacementDto = CreateTeacherReplacementDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTeacherReplacementDto.prototype, "originalTeacherId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTeacherReplacementDto.prototype, "replacementTeacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateTeacherReplacementDto.prototype, "studentIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTeacherReplacementDto.prototype, "selectAllStudents", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTeacherReplacementDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTeacherReplacementDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Start time must be HH:mm (24-hour)' }),
    __metadata("design:type", String)
], CreateTeacherReplacementDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'End time must be HH:mm (24-hour)' }),
    __metadata("design:type", String)
], CreateTeacherReplacementDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(replacement_reason_enum_1.ReplacementReason),
    __metadata("design:type", String)
], CreateTeacherReplacementDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.reason === replacement_reason_enum_1.ReplacementReason.OTHER),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTeacherReplacementDto.prototype, "customReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherReplacementDto.prototype, "notes", void 0);
//# sourceMappingURL=create-teacher-replacement.dto.js.map
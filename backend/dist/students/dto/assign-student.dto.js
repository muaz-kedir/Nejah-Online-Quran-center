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
exports.UnassignStudentDto = exports.AssignStudentDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ScheduleSlotDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleSlotDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleSlotDto.prototype, "startTimeString", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleSlotDto.prototype, "endTimeString", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScheduleSlotDto.prototype, "className", void 0);
class AssignStudentDto {
}
exports.AssignStudentDto = AssignStudentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignStudentDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignStudentDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScheduleSlotDto),
    __metadata("design:type", Array)
], AssignStudentDto.prototype, "schedules", void 0);
class UnassignStudentDto {
}
exports.UnassignStudentDto = UnassignStudentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnassignStudentDto.prototype, "studentId", void 0);
//# sourceMappingURL=assign-student.dto.js.map
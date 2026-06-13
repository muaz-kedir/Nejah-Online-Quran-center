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
exports.UpdateProgressionSettingsDto = exports.RecommendPromotionDto = exports.LevelActionDto = void 0;
const class_validator_1 = require("class-validator");
const student_entity_1 = require("../../students/entities/student.entity");
class LevelActionDto {
}
exports.LevelActionDto = LevelActionDto;
__decorate([
    (0, class_validator_1.IsIn)(['promote', 'demote', 'repeat', 'pause', 'resume']),
    __metadata("design:type", String)
], LevelActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(student_entity_1.QuranLevel),
    __metadata("design:type", String)
], LevelActionDto.prototype, "targetLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LevelActionDto.prototype, "reason", void 0);
class RecommendPromotionDto {
}
exports.RecommendPromotionDto = RecommendPromotionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecommendPromotionDto.prototype, "reason", void 0);
class UpdateProgressionSettingsDto {
}
exports.UpdateProgressionSettingsDto = UpdateProgressionSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['full_quran', 'teacher_recommendation']),
    __metadata("design:type", String)
], UpdateProgressionSettingsDto.prototype, "quranReadingCompletionMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProgressionSettingsDto.prototype, "tajweedRequiresEvaluation", void 0);
//# sourceMappingURL=level-action.dto.js.map
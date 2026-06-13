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
exports.TeacherReplacementsCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const teacher_replacements_service_1 = require("./teacher-replacements.service");
let TeacherReplacementsCron = class TeacherReplacementsCron {
    constructor(replacementsService) {
        this.replacementsService = replacementsService;
    }
    async handleLifecycle() {
        await this.replacementsService.processLifecycle();
    }
};
exports.TeacherReplacementsCron = TeacherReplacementsCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TeacherReplacementsCron.prototype, "handleLifecycle", null);
exports.TeacherReplacementsCron = TeacherReplacementsCron = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [teacher_replacements_service_1.TeacherReplacementsService])
], TeacherReplacementsCron);
//# sourceMappingURL=teacher-replacements.cron.js.map
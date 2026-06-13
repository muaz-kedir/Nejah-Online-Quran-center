"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QiratModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const qirat_service_1 = require("./qirat.service");
const qirat_controller_1 = require("./qirat.controller");
const reports_module_1 = require("../reports/reports.module");
const student_entity_1 = require("../students/entities/student.entity");
const class_session_entity_1 = require("../attendance/entities/class-session.entity");
const teacher_replacement_entity_1 = require("../teacher-replacements/entities/teacher-replacement.entity");
let QiratModule = class QiratModule {
};
exports.QiratModule = QiratModule;
exports.QiratModule = QiratModule = __decorate([
    (0, common_1.Module)({
        imports: [reports_module_1.ReportsModule, typeorm_1.TypeOrmModule.forFeature([student_entity_1.Student, class_session_entity_1.ClassSession, teacher_replacement_entity_1.TeacherReplacement])],
        controllers: [qirat_controller_1.QiratController],
        providers: [qirat_service_1.QiratService],
        exports: [qirat_service_1.QiratService],
    })
], QiratModule);
//# sourceMappingURL=qirat.module.js.map
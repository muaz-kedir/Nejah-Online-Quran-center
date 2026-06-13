"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const exam_entity_1 = require("./entities/exam.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
const exams_service_1 = require("./exams.service");
const exams_controller_1 = require("./exams.controller");
const students_module_1 = require("../students/students.module");
const teachers_module_1 = require("../teachers/teachers.module");
const progress_module_1 = require("../progress/progress.module");
let ExamsModule = class ExamsModule {
};
exports.ExamsModule = ExamsModule;
exports.ExamsModule = ExamsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([exam_entity_1.Exam, student_entity_1.Student, teacher_entity_1.Teacher, progress_entity_1.Progress]),
            students_module_1.StudentsModule,
            teachers_module_1.TeachersModule,
            progress_module_1.ProgressModule,
        ],
        controllers: [exams_controller_1.ExamsController],
        providers: [exams_service_1.ExamsService],
        exports: [exams_service_1.ExamsService, typeorm_1.TypeOrmModule],
    })
], ExamsModule);
//# sourceMappingURL=exams.module.js.map
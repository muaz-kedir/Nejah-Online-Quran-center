"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherApplicationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const teacher_applications_controller_1 = require("./teacher-applications.controller");
const teacher_applications_service_1 = require("./teacher-applications.service");
const teacher_application_entity_1 = require("./entities/teacher-application.entity");
const teacher_application_settings_entity_1 = require("./entities/teacher-application-settings.entity");
const teachers_module_1 = require("../teachers/teachers.module");
let TeacherApplicationsModule = class TeacherApplicationsModule {
};
exports.TeacherApplicationsModule = TeacherApplicationsModule;
exports.TeacherApplicationsModule = TeacherApplicationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([teacher_application_entity_1.TeacherApplication, teacher_application_settings_entity_1.TeacherApplicationSettings]),
            teachers_module_1.TeachersModule,
        ],
        controllers: [teacher_applications_controller_1.TeacherApplicationsController],
        providers: [teacher_applications_service_1.TeacherApplicationsService],
        exports: [teacher_applications_service_1.TeacherApplicationsService],
    })
], TeacherApplicationsModule);
//# sourceMappingURL=teacher-applications.module.js.map
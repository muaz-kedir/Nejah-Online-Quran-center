"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const progress_entity_1 = require("./entities/progress.entity");
const progress_log_entity_1 = require("./entities/progress-log.entity");
const feedback_entity_1 = require("./entities/feedback.entity");
const level_history_entity_1 = require("./entities/level-history.entity");
const progression_settings_entity_1 = require("./entities/progression-settings.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const user_entity_1 = require("../users/entities/user.entity");
const progress_service_1 = require("./progress.service");
const level_progression_service_1 = require("./level-progression.service");
const progress_controller_1 = require("./progress.controller");
const teachers_module_1 = require("../teachers/teachers.module");
const notifications_module_1 = require("../notifications/notifications.module");
let ProgressModule = class ProgressModule {
};
exports.ProgressModule = ProgressModule;
exports.ProgressModule = ProgressModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                progress_entity_1.Progress,
                progress_log_entity_1.ProgressLog,
                feedback_entity_1.Feedback,
                level_history_entity_1.StudentLevelHistory,
                progression_settings_entity_1.ProgressionSettings,
                student_entity_1.Student,
                teacher_entity_1.Teacher,
                parent_entity_1.Parent,
                user_entity_1.User,
            ]),
            teachers_module_1.TeachersModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [progress_controller_1.ProgressController],
        providers: [progress_service_1.ProgressService, level_progression_service_1.LevelProgressionService],
        exports: [progress_service_1.ProgressService, level_progression_service_1.LevelProgressionService, typeorm_1.TypeOrmModule],
    })
], ProgressModule);
//# sourceMappingURL=progress.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const parents_service_1 = require("./parents.service");
const parents_controller_1 = require("./parents.controller");
const parent_dashboard_controller_1 = require("./parent-dashboard.controller");
const parent_entity_1 = require("./entities/parent.entity");
const student_entity_1 = require("../students/entities/student.entity");
const user_entity_1 = require("../users/entities/user.entity");
const schedule_entity_1 = require("../schedules/entities/schedule.entity");
const homework_entity_1 = require("../homework/entities/homework.entity");
const feedback_entity_1 = require("../progress/entities/feedback.entity");
const progress_entity_1 = require("../progress/entities/progress.entity");
const progress_log_entity_1 = require("../progress/entities/progress-log.entity");
const users_module_1 = require("../users/users.module");
let ParentsModule = class ParentsModule {
};
exports.ParentsModule = ParentsModule;
exports.ParentsModule = ParentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            typeorm_1.TypeOrmModule.forFeature([
                parent_entity_1.Parent,
                student_entity_1.Student,
                user_entity_1.User,
                schedule_entity_1.Schedule,
                homework_entity_1.Homework,
                feedback_entity_1.Feedback,
                progress_entity_1.Progress,
                progress_log_entity_1.ProgressLog,
            ]),
        ],
        controllers: [parents_controller_1.ParentsController, parent_dashboard_controller_1.ParentDashboardController],
        providers: [parents_service_1.ParentsService],
        exports: [parents_service_1.ParentsService],
    })
], ParentsModule);
//# sourceMappingURL=parents.module.js.map
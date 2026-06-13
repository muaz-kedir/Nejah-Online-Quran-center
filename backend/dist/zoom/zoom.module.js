"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const zoom_service_1 = require("./zoom.service");
const live_session_service_1 = require("./live-session.service");
const session_attendance_service_1 = require("./session-attendance.service");
const session_note_service_1 = require("./session-note.service");
const zoom_webhook_service_1 = require("./zoom-webhook.service");
const zoom_analytics_service_1 = require("./zoom-analytics.service");
const live_session_controller_1 = require("./live-session.controller");
const session_note_controller_1 = require("./session-note.controller");
const zoom_webhook_controller_1 = require("./zoom-webhook.controller");
const zoom_settings_controller_1 = require("./zoom-settings.controller");
const zoom_analytics_controller_1 = require("./zoom-analytics.controller");
const session_attendance_controller_1 = require("./session-attendance.controller");
const parent_session_controller_1 = require("./parent-session.controller");
const zoom_integration_entity_1 = require("./entities/zoom-integration.entity");
const live_session_entity_1 = require("./entities/live-session.entity");
const session_attendance_entity_1 = require("./entities/session-attendance.entity");
const session_note_entity_1 = require("./entities/session-note.entity");
const processed_webhook_entity_1 = require("./entities/processed-webhook.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const teachers_module_1 = require("../teachers/teachers.module");
const encryption_service_1 = require("../common/encryption.service");
let ZoomModule = class ZoomModule {
};
exports.ZoomModule = ZoomModule;
exports.ZoomModule = ZoomModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                zoom_integration_entity_1.ZoomIntegration,
                live_session_entity_1.LiveSession,
                session_attendance_entity_1.SessionAttendance,
                session_note_entity_1.SessionNote,
                processed_webhook_entity_1.ProcessedWebhook,
                student_entity_1.Student,
                teacher_entity_1.Teacher,
                parent_entity_1.Parent,
            ]),
            axios_1.HttpModule.register({
                timeout: 15000,
                maxRedirects: 3,
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            notifications_module_1.NotificationsModule,
            teachers_module_1.TeachersModule,
        ],
        controllers: [
            live_session_controller_1.LiveSessionController,
            session_note_controller_1.SessionNoteController,
            zoom_webhook_controller_1.ZoomWebhookController,
            zoom_settings_controller_1.ZoomSettingsController,
            zoom_analytics_controller_1.ZoomAnalyticsController,
            session_attendance_controller_1.SessionAttendanceController,
            parent_session_controller_1.ParentSessionController,
        ],
        providers: [
            encryption_service_1.EncryptionService,
            zoom_service_1.ZoomService,
            live_session_service_1.LiveSessionService,
            session_attendance_service_1.SessionAttendanceService,
            session_note_service_1.SessionNoteService,
            zoom_webhook_service_1.ZoomWebhookService,
            zoom_analytics_service_1.ZoomAnalyticsService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
        exports: [
            zoom_service_1.ZoomService,
            live_session_service_1.LiveSessionService,
            session_attendance_service_1.SessionAttendanceService,
            zoom_webhook_service_1.ZoomWebhookService,
            zoom_analytics_service_1.ZoomAnalyticsService,
        ],
    })
], ZoomModule);
//# sourceMappingURL=zoom.module.js.map
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
exports.Notification = exports.NotificationChannel = exports.NotificationType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var NotificationType;
(function (NotificationType) {
    NotificationType["EMAIL"] = "EMAIL";
    NotificationType["PUSH"] = "PUSH";
    NotificationType["IN_APP"] = "IN_APP";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["MEETING_STARTED"] = "MEETING_STARTED";
    NotificationChannel["MEETING_ENDED"] = "MEETING_ENDED";
    NotificationChannel["ATTENDANCE_MARKED"] = "ATTENDANCE_MARKED";
    NotificationChannel["CLASS_ALERT"] = "CLASS_ALERT";
    NotificationChannel["STUDENT_JOINED"] = "STUDENT_JOINED";
    NotificationChannel["STUDENT_LEFT"] = "STUDENT_LEFT";
    NotificationChannel["SYSTEM_ALERT"] = "SYSTEM_ALERT";
    NotificationChannel["TEMP_REPLACEMENT"] = "TEMP_REPLACEMENT";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
let Notification = class Notification {
};
exports.Notification = Notification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Notification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Notification.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Notification.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: NotificationType }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: NotificationChannel }),
    __metadata("design:type", String)
], Notification.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Notification.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Notification.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "dataJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Notification.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Notification.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Notification.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Notification.prototype, "updatedAt", void 0);
exports.Notification = Notification = __decorate([
    (0, typeorm_1.Entity)('notifications')
], Notification);
//# sourceMappingURL=notification.entity.js.map
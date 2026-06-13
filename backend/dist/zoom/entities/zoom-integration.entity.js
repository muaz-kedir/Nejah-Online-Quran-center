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
exports.ZoomIntegration = void 0;
const typeorm_1 = require("typeorm");
const teacher_entity_1 = require("../../teachers/entities/teacher.entity");
let ZoomIntegration = class ZoomIntegration {
};
exports.ZoomIntegration = ZoomIntegration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ZoomIntegration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => teacher_entity_1.Teacher, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'teacherId' }),
    __metadata("design:type", teacher_entity_1.Teacher)
], ZoomIntegration.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ZoomIntegration.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ZoomIntegration.prototype, "zoomUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ZoomIntegration.prototype, "zoomEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZoomIntegration.prototype, "accessToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ZoomIntegration.prototype, "refreshToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ZoomIntegration.prototype, "tokenExpiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'disconnected' }),
    __metadata("design:type", String)
], ZoomIntegration.prototype, "connectionStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ZoomIntegration.prototype, "connectedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], ZoomIntegration.prototype, "disconnectedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ZoomIntegration.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ZoomIntegration.prototype, "updatedAt", void 0);
exports.ZoomIntegration = ZoomIntegration = __decorate([
    (0, typeorm_1.Entity)('zoom_integrations')
], ZoomIntegration);
//# sourceMappingURL=zoom-integration.entity.js.map
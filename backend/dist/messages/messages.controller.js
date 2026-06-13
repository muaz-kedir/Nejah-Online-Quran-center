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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let MessagesController = class MessagesController {
    constructor(messagesService) {
        this.messagesService = messagesService;
    }
    async getConversations(req) {
        return this.messagesService.getConversations(req.user.id, req.user.role);
    }
    async getMessages(req, otherPartyId, otherPartyRole) {
        return this.messagesService.getMessages(req.user.id, otherPartyId, req.user.role, otherPartyRole || user_role_enum_1.UserRole.STUDENT);
    }
    async sendMessage(req, dto) {
        return this.messagesService.sendMessage(req.user.id, req.user.role, dto.toId, dto.toRole, dto.subject, dto.body, dto.attachments);
    }
    async markAsRead(messageId) {
        await this.messagesService.markAsRead(messageId);
        return { message: 'Message marked as read' };
    }
    async markAllAsRead(req) {
        await this.messagesService.markAllAsRead(req.user.id, req.user.role);
        return { message: 'All messages marked as read' };
    }
    async deleteMessage(messageId) {
        await this.messagesService.deleteMessage(messageId);
        return { message: 'Message deleted' };
    }
    async getUnreadCount(req) {
        return this.messagesService.countUnreadMessages(req.user.id, req.user.role);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Get)('conversations'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:otherPartyId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('otherPartyId')),
    __param(2, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.QIRAT_MANAGER),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.TEACHER),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getUnreadCount", null);
exports.MessagesController = MessagesController = __decorate([
    (0, common_1.Controller)('messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [messages_service_1.MessagesService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map
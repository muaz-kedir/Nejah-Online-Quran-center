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
exports.Message = exports.MessageStatus = void 0;
const typeorm_1 = require("typeorm");
const user_role_enum_1 = require("../common/enums/user-role.enum");
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["SENDING"] = "sending";
    MessageStatus["SENT"] = "sent";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["READ"] = "read";
    MessageStatus["FAILED"] = "failed";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
let Message = class Message {
};
exports.Message = Message;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Message.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Message.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Message.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_role_enum_1.UserRole }),
    __metadata("design:type", String)
], Message.prototype, "fromRole", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Message.prototype, "fromId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_role_enum_1.UserRole }),
    __metadata("design:type", String)
], Message.prototype, "toRole", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Message.prototype, "toId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MessageStatus, default: MessageStatus.SENT }),
    __metadata("design:type", String)
], Message.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Message.prototype, "readAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "repliedToId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Message.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Message.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Message, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'repliedToId' }),
    __metadata("design:type", Message)
], Message.prototype, "repliedTo", void 0);
exports.Message = Message = __decorate([
    (0, typeorm_1.Entity)('messages')
], Message);
//# sourceMappingURL=messages.entity.js.map
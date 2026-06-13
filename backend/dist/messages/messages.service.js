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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const messages_entity_1 = require("./messages.entity");
const student_entity_1 = require("../students/entities/student.entity");
const teacher_entity_1 = require("../teachers/entities/teacher.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const user_entity_1 = require("../users/entities/user.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
let MessagesService = class MessagesService {
    constructor(messagesRepository, studentRepository, teacherRepository, parentRepository, userRepository) {
        this.messagesRepository = messagesRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.parentRepository = parentRepository;
        this.userRepository = userRepository;
    }
    async getConversations(userId, userRole) {
        const messages = await this.messagesRepository.find({
            where: [
                { fromId: userId, fromRole: userRole },
                { toId: userId, toRole: userRole },
            ],
            order: { createdAt: 'DESC' },
        });
        const conversations = new Map();
        for (const msg of messages) {
            const otherPartyId = msg.fromId === userId ? msg.toId : msg.fromId;
            const otherPartyRole = msg.fromId === userId ? msg.toRole : msg.fromRole;
            const key = `${otherPartyRole}-${otherPartyId}`;
            if (!conversations.has(key)) {
                const otherParty = await this.getOtherPartyInfo(otherPartyRole, otherPartyId);
                conversations.set(key, {
                    id: key,
                    otherParty,
                    lastMessage: msg,
                    unreadCount: msg.isRead ? 0 : 1,
                });
            }
            else {
                const existing = conversations.get(key);
                if (msg.createdAt > existing.lastMessage.createdAt) {
                    existing.lastMessage = msg;
                }
                if (!msg.isRead) {
                    existing.unreadCount += 1;
                }
            }
        }
        return Array.from(conversations.values());
    }
    async getMessages(fromId, toId, fromRole, toRole) {
        const messages = await this.messagesRepository.find({
            where: [
                { fromId, fromRole, toId, toRole },
                { fromId: toId, fromRole: toRole, toId, toRole: fromRole },
            ],
            order: { createdAt: 'ASC' },
        });
        const unreadMessages = messages.filter((m) => !m.isRead);
        for (const msg of unreadMessages) {
            msg.isRead = true;
            msg.readAt = new Date();
            await this.messagesRepository.save(msg);
        }
        return messages;
    }
    async sendMessage(fromId, fromRole, toId, toRole, subject, body, attachments) {
        if (fromRole === user_role_enum_1.UserRole.STUDENT) {
            if (toRole !== user_role_enum_1.UserRole.TEACHER &&
                toRole !== user_role_enum_1.UserRole.ADMIN &&
                toRole !== user_role_enum_1.UserRole.SUPER_ADMIN) {
                throw new common_1.BadRequestException('Students can only message teachers or administrators');
            }
        }
        if (fromRole === user_role_enum_1.UserRole.TEACHER) {
            if (toRole !== user_role_enum_1.UserRole.STUDENT &&
                toRole !== user_role_enum_1.UserRole.ADMIN &&
                toRole !== user_role_enum_1.UserRole.SUPER_ADMIN) {
                throw new common_1.BadRequestException('Teachers can only message students or administrators');
            }
        }
        const message = this.messagesRepository.create({
            subject,
            body,
            fromId,
            fromRole,
            toId,
            toRole,
            attachments,
        });
        return this.messagesRepository.save(message);
    }
    async markAsRead(messageId) {
        const message = await this.messagesRepository.findOne({ where: { id: messageId } });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        message.isRead = true;
        message.readAt = new Date();
        await this.messagesRepository.save(message);
    }
    async markAllAsRead(userId, userRole) {
        await this.messagesRepository
            .createQueryBuilder()
            .update(messages_entity_1.Message)
            .set({ isRead: true, readAt: new Date() })
            .where('toId = :userId AND toRole = :userRole AND isRead = false', { userId, userRole })
            .execute();
    }
    async deleteMessage(messageId) {
        const message = await this.messagesRepository.findOne({ where: { id: messageId } });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        await this.messagesRepository.remove(message);
    }
    async getOtherPartyInfo(role, id) {
        switch (role) {
            case user_role_enum_1.UserRole.STUDENT:
                const student = await this.studentRepository.findOne({ where: { id } });
                return {
                    id: student.id,
                    name: student.fullName,
                    avatarUrl: student.avatarUrl,
                    role: user_role_enum_1.UserRole.STUDENT,
                };
            case user_role_enum_1.UserRole.TEACHER:
                const teacher = await this.teacherRepository.findOne({ where: { id } });
                return {
                    id: teacher.id,
                    name: teacher.fullName,
                    avatarUrl: teacher.avatarUrl,
                    role: user_role_enum_1.UserRole.TEACHER,
                };
            case user_role_enum_1.UserRole.PARENT:
                const parent = await this.parentRepository.findOne({ where: { id } });
                return {
                    id: parent.id,
                    name: parent.fullName,
                    avatarUrl: parent.avatarUrl || null,
                    role: user_role_enum_1.UserRole.PARENT,
                };
            case user_role_enum_1.UserRole.ADMIN:
            case user_role_enum_1.UserRole.SUPER_ADMIN:
                const user = await this.userRepository.findOne({ where: { id } });
                return {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatar || null,
                    role: user.role,
                };
            default:
                return { id, name: 'Unknown', role };
        }
    }
    async getStudentConversation(partnerId, partnerRole, studentId) {
        return this.getMessages(studentId, partnerId, user_role_enum_1.UserRole.STUDENT, partnerRole);
    }
    async countUnreadMessages(userId, userRole) {
        return this.messagesRepository.count({
            where: { toId: userId, toRole: userRole, isRead: false },
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(messages_entity_1.Message)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(2, (0, typeorm_1.InjectRepository)(teacher_entity_1.Teacher)),
    __param(3, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MessagesService);
//# sourceMappingURL=messages.service.js.map
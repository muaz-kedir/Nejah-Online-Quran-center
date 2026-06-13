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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("../students/entities/student.entity");
const parent_entity_1 = require("../parents/entities/parent.entity");
const user_entity_1 = require("../users/entities/user.entity");
const user_role_enum_1 = require("../common/enums/user-role.enum");
const notification_entity_1 = require("./entities/notification.entity");
let NotificationsService = class NotificationsService {
    constructor(studentRepository, parentRepository, userRepository, notificationRepository) {
        this.studentRepository = studentRepository;
        this.parentRepository = parentRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }
    async notifyMeetingStarted(session, assignedStudentIds) {
        const students = await this.studentRepository.findByIds(assignedStudentIds);
        const parentIds = new Set();
        const studentUserIds = [];
        for (const student of students) {
            if (student.userId) {
                studentUserIds.push(student.userId);
            }
            if (student.parentId) {
                parentIds.add(student.parentId);
            }
        }
        const parents = await this.parentRepository.find({
            where: Array.from(parentIds).map((id) => ({ id })),
            relations: ['user'],
        });
        const parentUserIds = parents.filter((p) => p.user?.id).map((p) => p.user.id);
        const admins = await this.userRepository.find({
            where: [{ role: user_role_enum_1.UserRole.ADMIN }, { role: user_role_enum_1.UserRole.SUPER_ADMIN }],
        });
        const adminUserIds = admins.map((a) => a.id);
        const allRecipientIds = [...studentUserIds, ...parentUserIds, ...adminUserIds];
        const notification = {
            type: 'meeting_started',
            title: `Class Started: ${session.classTitle}`,
            message: `${session.teacher.fullName} has started the class. Click to join the meeting.`,
            data: {
                sessionId: session.id,
                meetingLink: session.meetingLink,
                classTitle: session.classTitle,
                subject: session.subject,
                teacherName: session.teacher.fullName,
                scheduledTime: session.scheduledStartTime,
            },
            recipientIds: allRecipientIds,
        };
        await this.sendNotification(notification);
    }
    async notifyMeetingEnded(session) {
        const attendances = await this.studentRepository.query(`SELECT DISTINCT "studentId" FROM student_attendance WHERE "classSessionId" = $1`, [session.id]);
        const studentIds = attendances.map((a) => a.studentId);
        const students = await this.studentRepository.findByIds(studentIds);
        const parentIds = new Set();
        const studentUserIds = [];
        for (const student of students) {
            if (student.userId) {
                studentUserIds.push(student.userId);
            }
            if (student.parentId) {
                parentIds.add(student.parentId);
            }
        }
        const parents = await this.parentRepository.find({
            where: Array.from(parentIds).map((id) => ({ id })),
            relations: ['user'],
        });
        const parentUserIds = parents.filter((p) => p.user?.id).map((p) => p.user.id);
        const allRecipientIds = [...studentUserIds, ...parentUserIds];
        const notification = {
            type: 'meeting_ended',
            title: `Class Ended: ${session.classTitle}`,
            message: `The class has ended. Your attendance has been recorded.`,
            data: {
                sessionId: session.id,
                classTitle: session.classTitle,
            },
            recipientIds: allRecipientIds,
        };
        await this.sendNotification(notification);
    }
    async notifyAttendanceRecorded(studentId, sessionId, status) {
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
            relations: ['parent', 'parent.user'],
        });
        if (!student)
            return;
        const recipientIds = [];
        if (student.userId) {
            recipientIds.push(student.userId);
        }
        if (student.parent?.user?.id) {
            recipientIds.push(student.parent.user.id);
        }
        const notification = {
            type: 'attendance_recorded',
            title: 'Attendance Recorded',
            message: `Your attendance has been marked as ${status}`,
            data: {
                sessionId,
                status,
                studentId,
            },
            recipientIds,
        };
        await this.sendNotification(notification);
    }
    async sendNotification(payload) {
        console.log('Sending notification:', payload);
        let channel = notification_entity_1.NotificationChannel.SYSTEM_ALERT;
        if (payload.type === 'meeting_started') {
            channel = notification_entity_1.NotificationChannel.MEETING_STARTED;
        }
        else if (payload.type === 'meeting_ended') {
            channel = notification_entity_1.NotificationChannel.MEETING_ENDED;
        }
        else if (payload.type === 'attendance_recorded') {
            channel = notification_entity_1.NotificationChannel.ATTENDANCE_MARKED;
        }
        else if (payload.type === 'class_cancelled') {
            channel = notification_entity_1.NotificationChannel.CLASS_ALERT;
        }
        if (payload.recipientIds && payload.recipientIds.length > 0) {
            const uniqueRecipientIds = Array.from(new Set(payload.recipientIds));
            const notificationsToSave = uniqueRecipientIds.map((userId) => {
                return this.notificationRepository.create({
                    userId,
                    type: notification_entity_1.NotificationType.IN_APP,
                    channel,
                    title: payload.title,
                    content: payload.message,
                    dataJson: payload.data,
                    isRead: false,
                    sentAt: new Date(),
                });
            });
            await this.notificationRepository.save(notificationsToSave);
        }
    }
    async sendMeetingNotification(sessionId, recipientIds, data) {
        const notification = {
            type: 'meeting_started',
            title: `Class Started: ${data.className}`,
            message: `${data.teacherName} has started the class. Click to join the meeting.`,
            data: {
                sessionId,
                meetingLink: data.meetingLink,
                className: data.className,
                teacherName: data.teacherName,
                scheduledTime: data.scheduledTime,
            },
            recipientIds,
        };
        await this.sendNotification(notification);
    }
    async getNotifications(userId) {
        return this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    async markNotificationAsRead(notificationId) {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId },
        });
        if (notification) {
            notification.isRead = true;
            await this.notificationRepository.save(notification);
        }
    }
    async sendCustomNotifications(recipientIds, title, message, data) {
        if (!recipientIds.length)
            return;
        const uniqueRecipientIds = Array.from(new Set(recipientIds));
        const notificationsToSave = uniqueRecipientIds.map((userId) => this.notificationRepository.create({
            userId,
            type: notification_entity_1.NotificationType.IN_APP,
            channel: notification_entity_1.NotificationChannel.SYSTEM_ALERT,
            title,
            content: message,
            dataJson: data,
            isRead: false,
            sentAt: new Date(),
        }));
        await this.notificationRepository.save(notificationsToSave);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
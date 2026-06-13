import { User } from '../../users/entities/user.entity';
export declare enum NotificationType {
    EMAIL = "EMAIL",
    PUSH = "PUSH",
    IN_APP = "IN_APP"
}
export declare enum NotificationChannel {
    MEETING_STARTED = "MEETING_STARTED",
    MEETING_ENDED = "MEETING_ENDED",
    ATTENDANCE_MARKED = "ATTENDANCE_MARKED",
    CLASS_ALERT = "CLASS_ALERT",
    STUDENT_JOINED = "STUDENT_JOINED",
    STUDENT_LEFT = "STUDENT_LEFT",
    SYSTEM_ALERT = "SYSTEM_ALERT",
    TEMP_REPLACEMENT = "TEMP_REPLACEMENT"
}
export declare class Notification {
    id: string;
    user: User;
    userId: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    content: string;
    dataJson: any;
    isRead: boolean;
    sentAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

import { UserRole } from '../common/enums/user-role.enum';
export declare enum MessageStatus {
    SENDING = "sending",
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    FAILED = "failed"
}
export declare class Message {
    id: string;
    subject: string;
    body: string;
    fromRole: UserRole;
    fromId: string;
    toRole: UserRole;
    toId: string;
    status: MessageStatus;
    isRead: boolean;
    readAt: Date;
    attachments: string;
    repliedToId: string;
    createdAt: Date;
    updatedAt: Date;
    repliedTo: Message;
}

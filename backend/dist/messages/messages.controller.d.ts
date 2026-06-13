import { MessagesService } from './messages.service';
import { UserRole } from '../common/enums/user-role.enum';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getConversations(req: any): Promise<any[]>;
    getMessages(req: any, otherPartyId: string, otherPartyRole?: string): Promise<import("./messages.entity").Message[]>;
    sendMessage(req: any, dto: {
        toId: string;
        toRole: UserRole;
        subject: string;
        body: string;
        attachments?: string;
    }): Promise<import("./messages.entity").Message>;
    markAsRead(messageId: string): Promise<{
        message: string;
    }>;
    markAllAsRead(req: any): Promise<{
        message: string;
    }>;
    deleteMessage(messageId: string): Promise<{
        message: string;
    }>;
    getUnreadCount(req: any): Promise<number>;
}

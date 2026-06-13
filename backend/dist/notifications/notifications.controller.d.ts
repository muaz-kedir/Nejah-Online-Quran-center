import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(req: any): Promise<import("./entities/notification.entity").Notification[]>;
    markAsRead(id: string): Promise<{
        success: boolean;
    }>;
}

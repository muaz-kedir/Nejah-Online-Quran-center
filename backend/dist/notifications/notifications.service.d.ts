import { Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { Parent } from '../parents/entities/parent.entity';
import { User } from '../users/entities/user.entity';
import { ClassSession } from '../attendance/entities/class-session.entity';
import { Notification } from './entities/notification.entity';
export interface NotificationPayload {
    type: 'meeting_started' | 'meeting_ended' | 'attendance_recorded' | 'class_cancelled';
    title: string;
    message: string;
    data: any;
    recipientIds: string[];
}
export declare class NotificationsService {
    private studentRepository;
    private parentRepository;
    private userRepository;
    private notificationRepository;
    constructor(studentRepository: Repository<Student>, parentRepository: Repository<Parent>, userRepository: Repository<User>, notificationRepository: Repository<Notification>);
    notifyMeetingStarted(session: ClassSession, assignedStudentIds: string[]): Promise<void>;
    notifyMeetingEnded(session: ClassSession): Promise<void>;
    notifyAttendanceRecorded(studentId: string, sessionId: string, status: string): Promise<void>;
    private sendNotification;
    sendMeetingNotification(sessionId: string, recipientIds: string[], data: {
        teacherName: string;
        className: string;
        meetingLink: string;
        scheduledTime: string | Date;
    }): Promise<void>;
    getNotifications(userId: string): Promise<Notification[]>;
    markNotificationAsRead(notificationId: string): Promise<void>;
    sendCustomNotifications(recipientIds: string[], title: string, message: string, data?: Record<string, unknown>): Promise<void>;
}

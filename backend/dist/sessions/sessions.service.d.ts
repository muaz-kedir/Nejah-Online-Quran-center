import { Repository } from 'typeorm';
import { SessionMeeting } from './entities/session-meeting.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class SessionService {
    private sessionRepository;
    private scheduleRepository;
    private notificationService;
    constructor(sessionRepository: Repository<SessionMeeting>, scheduleRepository: Repository<Schedule>, notificationService: NotificationsService);
    startMeeting(scheduleId: string, teacherId: string, meetingLink: string): Promise<SessionMeeting>;
    endMeeting(sessionId: string): Promise<SessionMeeting>;
    getActiveSession(teacherId: string): Promise<SessionMeeting>;
    getScheduleSession(scheduleId: string): Promise<SessionMeeting>;
    recordTeacherJoin(sessionId: string): Promise<SessionMeeting>;
    recordTeacherLeave(sessionId: string): Promise<SessionMeeting>;
    getSessionDetails(sessionId: string): Promise<SessionMeeting>;
    getLiveSessionsForAdmin(): Promise<SessionMeeting[]>;
    getSessionsForSchedule(scheduleId: string): Promise<SessionMeeting[]>;
    private getScheduleStudents;
    private getStudentParents;
    private getAdmins;
}

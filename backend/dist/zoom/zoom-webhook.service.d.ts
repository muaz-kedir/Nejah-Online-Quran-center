import { Repository } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { ZoomService } from './zoom.service';
import { SessionAttendanceService } from './session-attendance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Student } from '../students/entities/student.entity';
import { ProcessedWebhook } from './entities/processed-webhook.entity';
export declare class ZoomWebhookService {
    private readonly liveSessionRepository;
    private readonly attendanceRepository;
    private readonly studentRepository;
    private readonly processedWebhookRepository;
    private readonly zoomService;
    private readonly sessionAttendanceService;
    private readonly notificationsService;
    private readonly logger;
    constructor(liveSessionRepository: Repository<LiveSession>, attendanceRepository: Repository<SessionAttendance>, studentRepository: Repository<Student>, processedWebhookRepository: Repository<ProcessedWebhook>, zoomService: ZoomService, sessionAttendanceService: SessionAttendanceService, notificationsService: NotificationsService);
    handleWebhook(event: string, payload: Record<string, unknown>, eventId?: string): Promise<void>;
    private handleMeetingStarted;
    private handleMeetingEnded;
    private handleParticipantJoined;
    private handleParticipantLeft;
    private resolveStudentFromParticipant;
    private extractMeetingId;
}

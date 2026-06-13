import { Repository } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { QueryLiveSessionDto } from './dto/query-live-session.dto';
import { ZoomService } from './zoom.service';
import { ZoomIntegration } from './entities/zoom-integration.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class LiveSessionService {
    private readonly liveSessionRepository;
    private readonly attendanceRepository;
    private readonly zoomIntegrationRepository;
    private readonly zoomService;
    private readonly notificationsService;
    private readonly logger;
    constructor(liveSessionRepository: Repository<LiveSession>, attendanceRepository: Repository<SessionAttendance>, zoomIntegrationRepository: Repository<ZoomIntegration>, zoomService: ZoomService, notificationsService: NotificationsService);
    create(dto: CreateLiveSessionDto): Promise<LiveSession>;
    createWithZoom(dto: CreateLiveSessionDto): Promise<LiveSession>;
    findById(id: string): Promise<LiveSession>;
    findAll(query: QueryLiveSessionDto): Promise<{
        data: LiveSession[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    update(id: string, dto: UpdateLiveSessionDto): Promise<LiveSession>;
    cancel(id: string): Promise<LiveSession>;
    start(teacherId: string, id: string): Promise<LiveSession>;
    complete(id: string): Promise<LiveSession>;
    getUpcoming(teacherId?: string, studentId?: string): Promise<LiveSession[]>;
    getTeacherSessions(teacherId: string, page?: number, limit?: number): Promise<{
        data: LiveSession[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStudentSessions(studentId: string, page?: number, limit?: number): Promise<{
        data: LiveSession[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateZoomMeeting(scheduleId: string, startTime?: Date, endTime?: Date, className?: string): Promise<void>;
    deleteZoomMeeting(scheduleId: string): Promise<void>;
    getLiveSessions(): Promise<LiveSession[]>;
    getTodaysSessions(teacherId?: string): Promise<LiveSession[]>;
    getSessionStats(): Promise<{
        total: number;
        completed: number;
        cancelled: number;
        live: number;
        scheduled: number;
    }>;
}

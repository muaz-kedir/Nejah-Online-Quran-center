import { Repository } from 'typeorm';
import { SessionAttendance } from './entities/session-attendance.entity';
import { LiveSession } from './entities/live-session.entity';
export declare class SessionAttendanceService {
    private readonly attendanceRepository;
    private readonly liveSessionRepository;
    private readonly logger;
    constructor(attendanceRepository: Repository<SessionAttendance>, liveSessionRepository: Repository<LiveSession>);
    recordJoin(sessionId: string, studentId: string): Promise<SessionAttendance>;
    recordLeave(sessionId: string, studentId: string): Promise<SessionAttendance>;
    markAbsent(sessionId: string, studentId: string): Promise<SessionAttendance>;
    getAttendanceForSession(sessionId: string): Promise<SessionAttendance[]>;
    getAttendanceForStudent(studentId: string, page?: number, limit?: number): Promise<{
        data: SessionAttendance[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAttendanceStats(studentId: string): Promise<{
        total: number;
        present: number;
        late: number;
        absent: number;
        leftEarly: number;
        attendancePercentage: number;
    }>;
    bulkCreateAttendance(sessionId: string, studentIds: string[]): Promise<void>;
}

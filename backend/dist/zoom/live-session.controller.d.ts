import { Repository } from 'typeorm';
import { LiveSessionService } from './live-session.service';
import { SessionAttendanceService } from './session-attendance.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { QueryLiveSessionDto } from './dto/query-live-session.dto';
import { TeachersService } from '../teachers/teachers.service';
import { Parent } from '../parents/entities/parent.entity';
import { Student } from '../students/entities/student.entity';
export declare class LiveSessionController {
    private readonly liveSessionService;
    private readonly sessionAttendanceService;
    private readonly teachersService;
    private readonly parentRepository;
    private readonly studentRepository;
    constructor(liveSessionService: LiveSessionService, sessionAttendanceService: SessionAttendanceService, teachersService: TeachersService, parentRepository: Repository<Parent>, studentRepository: Repository<Student>);
    create(req: any, dto: CreateLiveSessionDto): Promise<import("./entities/live-session.entity").LiveSession>;
    createWithZoom(req: any, dto: CreateLiveSessionDto): Promise<import("./entities/live-session.entity").LiveSession>;
    findAll(query: QueryLiveSessionDto): Promise<{
        data: import("./entities/live-session.entity").LiveSession[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUpcoming(req: any, studentId?: string): Promise<import("./entities/live-session.entity").LiveSession[]>;
    getLiveSessions(): Promise<import("./entities/live-session.entity").LiveSession[]>;
    getTodaysSessions(req: any): Promise<import("./entities/live-session.entity").LiveSession[]>;
    getStats(): Promise<{
        total: number;
        completed: number;
        cancelled: number;
        live: number;
        scheduled: number;
    }>;
    getTeacherSessions(req: any, page?: number, limit?: number): Promise<{
        data: import("./entities/live-session.entity").LiveSession[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStudentSessions(req: any, studentId: string, page?: number, limit?: number): Promise<{
        data: import("./entities/live-session.entity").LiveSession[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<import("./entities/live-session.entity").LiveSession>;
    update(id: string, dto: UpdateLiveSessionDto, req: any): Promise<import("./entities/live-session.entity").LiveSession>;
    start(id: string, req: any): Promise<import("./entities/live-session.entity").LiveSession>;
    complete(id: string): Promise<import("./entities/live-session.entity").LiveSession>;
    cancel(id: string): Promise<import("./entities/live-session.entity").LiveSession>;
}

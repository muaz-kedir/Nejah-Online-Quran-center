import { Repository } from 'typeorm';
import { LiveSession } from './entities/live-session.entity';
import { SessionAttendance } from './entities/session-attendance.entity';
import { Student } from '../students/entities/student.entity';
import { Teacher } from '../teachers/entities/teacher.entity';
export declare class ZoomAnalyticsService {
    private readonly liveSessionRepository;
    private readonly attendanceRepository;
    private readonly studentRepository;
    private readonly teacherRepository;
    private readonly logger;
    constructor(liveSessionRepository: Repository<LiveSession>, attendanceRepository: Repository<SessionAttendance>, studentRepository: Repository<Student>, teacherRepository: Repository<Teacher>);
    getDashboardAnalytics(): Promise<any>;
    getTeacherAnalytics(teacherId: string): Promise<any>;
    getStudentAnalytics(studentId: string): Promise<any>;
    getMonthlyTrends(year: number, month: number): Promise<any>;
    getOverallStats(): Promise<any>;
}

import { Repository } from 'typeorm';
import { SessionAttendanceService } from './session-attendance.service';
import { Parent } from '../parents/entities/parent.entity';
import { Student } from '../students/entities/student.entity';
export declare class SessionAttendanceController {
    private readonly sessionAttendanceService;
    private readonly parentRepository;
    private readonly studentRepository;
    constructor(sessionAttendanceService: SessionAttendanceService, parentRepository: Repository<Parent>, studentRepository: Repository<Student>);
    getStudentAttendance(req: any, studentId: string, page?: number, limit?: number): Promise<{
        data: import("./entities/session-attendance.entity").SessionAttendance[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStudentAttendanceStats(req: any, studentId: string): Promise<{
        total: number;
        present: number;
        late: number;
        absent: number;
        leftEarly: number;
        attendancePercentage: number;
    }>;
    getSessionAttendance(sessionId: string): Promise<import("./entities/session-attendance.entity").SessionAttendance[]>;
}

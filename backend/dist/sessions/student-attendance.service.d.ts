import { Repository } from 'typeorm';
import { StudentSessionAttendance, StudentAttendanceStatus } from './entities/student-session-attendance.entity';
import { SessionMeeting } from './entities/session-meeting.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
export declare class StudentAttendanceService {
    private attendanceRepository;
    private sessionRepository;
    private scheduleRepository;
    constructor(attendanceRepository: Repository<StudentSessionAttendance>, sessionRepository: Repository<SessionMeeting>, scheduleRepository: Repository<Schedule>);
    recordStudentJoin(sessionId: string, studentId: string): Promise<StudentSessionAttendance>;
    recordStudentLeave(sessionId: string, studentId: string): Promise<StudentSessionAttendance>;
    calculateAttendanceStatus(studentId: string, sessionId: string): Promise<StudentAttendanceStatus>;
    getStudentAttendanceBySchedule(studentId: string, scheduleId: string): Promise<StudentSessionAttendance[]>;
    getStudentAttendancePercentage(studentId: string, fromDate: Date, toDate: Date): Promise<number>;
    getStudentAttendanceHistory(studentId: string, limit?: number, offset?: number): Promise<StudentSessionAttendance[]>;
    markAbsent(sessionId: string, studentId: string): Promise<StudentSessionAttendance>;
    getSessionAttendance(sessionId: string): Promise<StudentSessionAttendance[]>;
}

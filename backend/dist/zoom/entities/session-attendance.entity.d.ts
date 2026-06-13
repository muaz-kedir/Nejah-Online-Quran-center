import { LiveSession } from './live-session.entity';
import { Student } from '../../students/entities/student.entity';
import { AttendanceStatus } from '../enums/live-session-status.enum';
export declare class SessionAttendance {
    id: string;
    session: LiveSession;
    sessionId: string;
    student: Student;
    studentId: string;
    joinTime: Date;
    leaveTime: Date;
    duration: number;
    attendanceStatus: AttendanceStatus;
    createdAt: Date;
    updatedAt: Date;
}

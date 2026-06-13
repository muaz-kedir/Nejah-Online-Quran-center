import { Student } from '../../students/entities/student.entity';
import { StudentSessionAttendance } from '../../sessions/entities/student-session-attendance.entity';
export declare class Attendance {
    id: string;
    date: string;
    isPresent: boolean;
    student: Student;
    studentId: string;
    sessionAttendance: StudentSessionAttendance;
    sessionAttendanceId: string;
    createdAt: Date;
    updatedAt: Date;
}

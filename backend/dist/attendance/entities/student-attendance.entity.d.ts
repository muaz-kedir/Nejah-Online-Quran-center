import { Student } from '../../students/entities/student.entity';
import { ClassSession } from './class-session.entity';
export declare enum StudentAttendanceStatus {
    PRESENT = "PRESENT",
    LATE = "LATE",
    ABSENT = "ABSENT",
    LEFT_EARLY = "LEFT_EARLY"
}
export declare class StudentAttendance {
    id: string;
    studentId: string;
    student: Student;
    classSessionId: string;
    classSession: ClassSession;
    attendanceStatus: StudentAttendanceStatus;
    joinTime: Date;
    leaveTime: Date;
    durationMinutes: number;
    notificationSent: boolean;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

import { Student } from '../../students/entities/student.entity';
import { SessionMeeting } from './session-meeting.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
export declare enum StudentAttendanceStatus {
    PRESENT = "PRESENT",
    LATE = "LATE",
    ABSENT = "ABSENT",
    LEFT_EARLY = "LEFT_EARLY"
}
export declare class StudentSessionAttendance {
    id: string;
    session: SessionMeeting;
    sessionMeetingId: string;
    student: Student;
    studentId: string;
    joinTime: Date;
    leaveTime: Date;
    totalDuration: number;
    attendanceStatus: StudentAttendanceStatus;
    attendanceRecords: Attendance[];
    createdAt: Date;
    updatedAt: Date;
}
